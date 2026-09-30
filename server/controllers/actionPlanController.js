import ActionPlan from '../models/ActionPlan.js';
import PlanAction from '../models/PlanAction.js';

/**
 * Recalculate Overall Climate Action Plan Progress & Status based on sub-actions
 * @param {string} planId - Mongoose ActionPlan ID
 */
export const recalculatePlanProgress = async (planId) => {
  const plan = await ActionPlan.findById(planId);
  if (!plan) return;

  const actions = await PlanAction.find({ plan: planId });
  if (actions.length === 0) {
    plan.overallProgress = 0;
    plan.status = 'Planned';
    await plan.save();
    return;
  }

  const totalProgressSum = actions.reduce((acc, a) => acc + (a.progressPercentage || 0), 0);
  const avgProgress = Math.round(totalProgressSum / actions.length);
  plan.overallProgress = avgProgress;

  const allCompleted = actions.every(a => a.status === 'Completed' || a.progressPercentage === 100);
  const anyDelayed = actions.some(a => a.status === 'Delayed');
  const anyInProgress = actions.some(a => a.status === 'In Progress' || a.progressPercentage > 0);

  if (allCompleted || avgProgress === 100) {
    plan.status = 'Completed';
  } else if (anyDelayed) {
    plan.status = 'Delayed';
  } else if (anyInProgress || avgProgress > 0) {
    plan.status = 'In Progress';
  } else {
    plan.status = 'Planned';
  }

  await plan.save();
};

/**
 * @desc    Get all climate action plans with actions summary
 * @route   GET /api/action-plans
 * @access  Private (Authenticated users)
 */
export const getActionPlans = async (req, res) => {
  try {
    const { status, search } = req.query;

    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { planName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const plans = await ActionPlan.find(query)
      .populate('createdBy', 'name email role department')
      .sort({ createdAt: -1 });

    const plansWithActions = await Promise.all(
      plans.map(async (plan) => {
        const actions = await PlanAction.find({ plan: plan._id })
          .populate('createdBy', 'name email role')
          .sort({ startDate: 1 });

        const totalExpected = actions.reduce((acc, a) => acc + (a.expectedCarbonReduction || 0), 0);
        const totalActual = actions.reduce((acc, a) => acc + (a.actualCarbonReduction || 0), 0);

        return {
          ...plan.toObject(),
          actionsCount: actions.length,
          totalExpectedReduction: Number(totalExpected.toFixed(2)),
          totalActualReduction: Number(totalActual.toFixed(2)),
          actions
        };
      })
    );

    // Aggregate summary stats
    const totalReductionTarget = plansWithActions.reduce((acc, p) => acc + (p.emissionReductionTarget || 0), 0);
    const totalAchievedReduction = plansWithActions.reduce((acc, p) => acc + (p.totalActualReduction || 0), 0);
    const avgOverallProgress = plansWithActions.length > 0
      ? Math.round(plansWithActions.reduce((acc, p) => acc + (p.overallProgress || 0), 0) / plansWithActions.length)
      : 0;

    res.status(200).json({
      status: 'success',
      count: plansWithActions.length,
      summary: {
        totalPlans: plansWithActions.length,
        totalReductionTarget,
        totalAchievedReduction,
        avgOverallProgress
      },
      plans: plansWithActions
    });
  } catch (error) {
    console.error('[Get Action Plans Error]', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch climate action plans'
    });
  }
};

/**
 * @desc    Get single climate action plan by ID with populated actions
 * @route   GET /api/action-plans/:id
 * @access  Private
 */
export const getActionPlanById = async (req, res) => {
  try {
    const plan = await ActionPlan.findById(req.params.id).populate('createdBy', 'name email role');

    if (!plan) {
      return res.status(404).json({
        status: 'error',
        message: 'Climate action plan not found'
      });
    }

    const actions = await PlanAction.find({ plan: plan._id })
      .populate('createdBy', 'name email role')
      .sort({ startDate: 1 });

    res.status(200).json({
      status: 'success',
      plan: {
        ...plan.toObject(),
        actions
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch climate action plan details'
    });
  }
};

/**
 * @desc    Create a new Climate Action Plan
 * @route   POST /api/action-plans
 * @access  Private
 */
export const createActionPlan = async (req, res) => {
  try {
    const { planName, description, startDate, targetDate, emissionReductionTarget, status } = req.body;

    if (!planName || !description || !startDate || !targetDate || emissionReductionTarget === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide plan name, description, start date, target date, and emission reduction target.'
      });
    }

    const target = Number(emissionReductionTarget);
    if (isNaN(target) || target < 0) {
      return res.status(400).json({ status: 'error', message: 'Target reduction must be a valid non-negative number.' });
    }

    const plan = await ActionPlan.create({
      planName: planName.trim(),
      description: description.trim(),
      startDate,
      targetDate,
      emissionReductionTarget: target,
      status: status || 'Planned',
      overallProgress: 0,
      createdBy: req.user._id
    });

    const populatedPlan = await ActionPlan.findById(plan._id).populate('createdBy', 'name email role');

    res.status(201).json({
      status: 'success',
      message: 'Climate action plan created successfully',
      plan: {
        ...populatedPlan.toObject(),
        actions: []
      }
    });
  } catch (error) {
    console.error('[Create Action Plan Error]', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to create climate action plan'
    });
  }
};

/**
 * @desc    Update Climate Action Plan metadata
 * @route   PUT /api/action-plans/:id
 * @access  Private
 */
export const updateActionPlan = async (req, res) => {
  try {
    const { planName, description, startDate, targetDate, emissionReductionTarget, status } = req.body;

    const plan = await ActionPlan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({ status: 'error', message: 'Climate action plan not found' });
    }

    if (planName) plan.planName = planName.trim();
    if (description) plan.description = description.trim();
    if (startDate) plan.startDate = startDate;
    if (targetDate) plan.targetDate = targetDate;
    if (emissionReductionTarget !== undefined) plan.emissionReductionTarget = Number(emissionReductionTarget);
    if (status) plan.status = status;

    const updatedPlan = await plan.save();
    await recalculatePlanProgress(updatedPlan._id);

    const refreshedPlan = await ActionPlan.findById(updatedPlan._id).populate('createdBy', 'name email role');

    res.status(200).json({
      status: 'success',
      message: 'Climate action plan updated successfully',
      plan: refreshedPlan
    });
  } catch (error) {
    console.error('[Update Action Plan Error]', error);
    res.status(500).json({ status: 'error', message: error.message || 'Failed to update action plan' });
  }
};

/**
 * @desc    Delete Climate Action Plan and its actions
 * @route   DELETE /api/action-plans/:id
 * @access  Private
 */
export const deleteActionPlan = async (req, res) => {
  try {
    const plan = await ActionPlan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({ status: 'error', message: 'Climate action plan not found' });
    }

    await PlanAction.deleteMany({ plan: plan._id });
    await plan.deleteOne();

    res.status(200).json({
      status: 'success',
      message: 'Climate action plan and its sub-actions deleted successfully'
    });
  } catch (error) {
    console.error('[Delete Action Plan Error]', error);
    res.status(500).json({ status: 'error', message: error.message || 'Failed to delete action plan' });
  }
};

/**
 * @desc    Add a new sub-action to a Climate Action Plan
 * @route   POST /api/action-plans/:id/actions
 * @access  Private
 */
export const addAction = async (req, res) => {
  try {
    const planId = req.params.id;
    const plan = await ActionPlan.findById(planId);

    if (!plan) {
      return res.status(404).json({ status: 'error', message: 'Climate action plan not found' });
    }

    const {
      actionName,
      description,
      responsibleDepartment,
      startDate,
      targetDate,
      expectedCarbonReduction,
      actualCarbonReduction,
      progressPercentage,
      status
    } = req.body;

    if (!actionName || !description || !responsibleDepartment || !startDate || !targetDate || expectedCarbonReduction === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide action name, description, responsible department, start date, target date, and expected reduction.'
      });
    }

    let prog = Number(progressPercentage) || 0;
    if (prog < 0) prog = 0;
    if (prog > 100) prog = 100;

    let assignedStatus = status || 'Planned';
    if (prog === 100) assignedStatus = 'Completed';
    else if (prog > 0 && assignedStatus === 'Planned') assignedStatus = 'In Progress';

    const action = await PlanAction.create({
      plan: plan._id,
      actionName: actionName.trim(),
      description: description.trim(),
      responsibleDepartment: responsibleDepartment.trim(),
      startDate,
      targetDate,
      expectedCarbonReduction: Number(expectedCarbonReduction) || 0,
      actualCarbonReduction: Number(actualCarbonReduction) || 0,
      progressPercentage: prog,
      status: assignedStatus,
      createdBy: req.user._id
    });

    // Recalculate parent plan overall progress
    await recalculatePlanProgress(plan._id);

    const populatedAction = await PlanAction.findById(action._id).populate('createdBy', 'name email role');

    res.status(201).json({
      status: 'success',
      message: 'Action added to climate action plan successfully',
      action: populatedAction
    });
  } catch (error) {
    console.error('[Add Action Error]', error);
    res.status(500).json({ status: 'error', message: error.message || 'Failed to add action' });
  }
};

/**
 * @desc    Update a sub-action item
 * @route   PUT /api/action-plans/actions/:actionId
 * @access  Private
 */
export const updateAction = async (req, res) => {
  try {
    const action = await PlanAction.findById(req.params.actionId);

    if (!action) {
      return res.status(404).json({ status: 'error', message: 'Action item not found' });
    }

    const {
      actionName,
      description,
      responsibleDepartment,
      startDate,
      targetDate,
      expectedCarbonReduction,
      actualCarbonReduction,
      progressPercentage,
      status
    } = req.body;

    if (actionName) action.actionName = actionName.trim();
    if (description) action.description = description.trim();
    if (responsibleDepartment) action.responsibleDepartment = responsibleDepartment.trim();
    if (startDate) action.startDate = startDate;
    if (targetDate) action.targetDate = targetDate;
    if (expectedCarbonReduction !== undefined) action.expectedCarbonReduction = Number(expectedCarbonReduction);
    if (actualCarbonReduction !== undefined) action.actualCarbonReduction = Number(actualCarbonReduction);

    if (progressPercentage !== undefined) {
      let prog = Number(progressPercentage);
      if (prog < 0) prog = 0;
      if (prog > 100) prog = 100;
      action.progressPercentage = prog;

      if (prog === 100) action.status = 'Completed';
    }

    if (status && action.progressPercentage < 100) {
      action.status = status;
    }

    const updatedAction = await action.save();

    // Recalculate parent plan progress
    await recalculatePlanProgress(action.plan);

    const populatedAction = await PlanAction.findById(updatedAction._id).populate('createdBy', 'name email role');

    res.status(200).json({
      status: 'success',
      message: 'Action updated successfully',
      action: populatedAction
    });
  } catch (error) {
    console.error('[Update Action Error]', error);
    res.status(500).json({ status: 'error', message: error.message || 'Failed to update action' });
  }
};

/**
 * @desc    Delete a sub-action item
 * @route   DELETE /api/action-plans/actions/:actionId
 * @access  Private
 */
export const deleteAction = async (req, res) => {
  try {
    const action = await PlanAction.findById(req.params.actionId);

    if (!action) {
      return res.status(404).json({ status: 'error', message: 'Action item not found' });
    }

    const planId = action.plan;
    await action.deleteOne();

    // Recalculate parent plan progress
    await recalculatePlanProgress(planId);

    res.status(200).json({
      status: 'success',
      message: 'Action item deleted successfully'
    });
  } catch (error) {
    console.error('[Delete Action Error]', error);
    res.status(500).json({ status: 'error', message: error.message || 'Failed to delete action item' });
  }
};
