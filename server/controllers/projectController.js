import Project from '../models/Project.js';
import { canAccessDepartment } from '../middleware/authMiddleware.js';

/**
 * @desc    Get all carbon reduction projects with search & filtering
 * @route   GET /api/projects
 * @access  Private (Authenticated users)
 */
export const getProjects = async (req, res) => {
  try {
    const { status, department, search } = req.query;

    const query = {};

    if (status) query.status = status;
    if (department) query.department = department;

    if (search) {
      query.$or = [
        { projectName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    const projects = await Project.find(query)
      .populate('createdBy', 'name email role department')
      .sort({ createdAt: -1 });

    // Aggregate summary statistics
    const totalBudget = projects.reduce((acc, p) => acc + (p.budget || 0), 0);
    const totalExpectedReduction = projects.reduce((acc, p) => acc + (p.expectedCarbonReduction || 0), 0);
    const totalActualReduction = projects.reduce((acc, p) => acc + (p.actualCarbonReduction || 0), 0);
    const completedCount = projects.filter(p => p.status === 'Completed').length;

    res.status(200).json({
      status: 'success',
      count: projects.length,
      summary: {
        totalBudget,
        totalExpectedReduction: Number(totalExpectedReduction.toFixed(2)),
        totalActualReduction: Number(totalActualReduction.toFixed(2)),
        completedCount
      },
      projects
    });
  } catch (error) {
    console.error('[Get Projects Error]', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch carbon reduction projects'
    });
  }
};

/**
 * @desc    Get single project by ID
 * @route   GET /api/projects/:id
 * @access  Private
 */
export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate(
      'createdBy',
      'name email role department'
    );

    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found'
      });
    }

    if (!canAccessDepartment(req.user, project.department)) {
      return res.status(403).json({ status: 'error', message: 'Access denied for this department.' });
    }

    res.status(200).json({
      status: 'success',
      project
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch project details'
    });
  }
};

/**
 * @desc    Create a new carbon reduction project
 * @route   POST /api/projects
 * @access  Private
 */
export const createProject = async (req, res) => {
  try {
    const {
      projectName,
      description,
      department,
      startDate,
      targetCompletionDate,
      budget,
      expectedCarbonReduction,
      actualCarbonReduction,
      progressPercentage,
      status,
      notes
    } = req.body;

    if (!projectName || !description || !department || !startDate || !targetCompletionDate || expectedCarbonReduction === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide project name, description, department, start date, target completion date, and expected carbon reduction.'
      });
    }

    let progress = Number(progressPercentage) || 0;
    if (progress < 0) progress = 0;
    if (progress > 100) progress = 100;

    let assignedStatus = status || 'Planned';
    if (progress === 100) assignedStatus = 'Completed';
    else if (progress > 0 && assignedStatus === 'Planned') assignedStatus = 'In Progress';

    const project = await Project.create({
      projectName: projectName.trim(),
      description: description.trim(),
      department: department.trim(),
      startDate,
      targetCompletionDate,
      budget: Number(budget) || 0,
      expectedCarbonReduction: Number(expectedCarbonReduction) || 0,
      actualCarbonReduction: Number(actualCarbonReduction) || 0,
      progressPercentage: progress,
      status: assignedStatus,
      notes: notes ? notes.trim() : '',
      createdBy: req.user._id
    });

    const populatedProject = await Project.findById(project._id).populate(
      'createdBy',
      'name email role'
    );

    res.status(201).json({
      status: 'success',
      message: 'Carbon reduction project created successfully',
      project: populatedProject
    });
  } catch (error) {
    console.error('[Create Project Error]', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to create project'
    });
  }
};

/**
 * @desc    Update project details
 * @route   PUT /api/projects/:id
 * @access  Private
 */
export const updateProject = async (req, res) => {
  try {
    const {
      projectName,
      description,
      department,
      startDate,
      targetCompletionDate,
      budget,
      expectedCarbonReduction,
      actualCarbonReduction,
      progressPercentage,
      status,
      notes
    } = req.body;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found'
      });
    }

    if (!canAccessDepartment(req.user, project.department)) {
      return res.status(403).json({ status: 'error', message: 'Access denied for this department.' });
    }

    if (projectName) project.projectName = projectName.trim();
    if (description) project.description = description.trim();
    if (department) project.department = department.trim();
    if (startDate) project.startDate = startDate;
    if (targetCompletionDate) project.targetCompletionDate = targetCompletionDate;
    if (budget !== undefined) project.budget = Number(budget);
    if (expectedCarbonReduction !== undefined) project.expectedCarbonReduction = Number(expectedCarbonReduction);
    if (actualCarbonReduction !== undefined) project.actualCarbonReduction = Number(actualCarbonReduction);
    if (notes !== undefined) project.notes = notes.trim();

    if (progressPercentage !== undefined) {
      let prog = Number(progressPercentage);
      if (prog < 0) prog = 0;
      if (prog > 100) prog = 100;
      project.progressPercentage = prog;

      if (prog === 100) project.status = 'Completed';
    }

    if (status && project.progressPercentage < 100) {
      project.status = status;
    }

    const updatedProject = await project.save();
    const populatedProject = await Project.findById(updatedProject._id).populate(
      'createdBy',
      'name email role'
    );

    res.status(200).json({
      status: 'success',
      message: 'Project details updated successfully',
      project: populatedProject
    });
  } catch (error) {
    console.error('[Update Project Error]', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to update project'
    });
  }
};

/**
 * @desc    Update project progress % and actual reduction
 * @route   PUT /api/projects/:id/progress
 * @access  Private
 */
export const updateProjectProgress = async (req, res) => {
  try {
    const { progressPercentage, actualCarbonReduction } = req.body;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found'
      });
    }

    if (!canAccessDepartment(req.user, project.department)) {
      return res.status(403).json({ status: 'error', message: 'Access denied for this department.' });
    }

    if (progressPercentage !== undefined) {
      let prog = Number(progressPercentage);
      if (prog < 0) prog = 0;
      if (prog > 100) prog = 100;
      project.progressPercentage = prog;

      if (prog === 100) {
        project.status = 'Completed';
      } else if (prog > 0 && project.status === 'Planned') {
        project.status = 'In Progress';
      }
    }

    if (actualCarbonReduction !== undefined) {
      project.actualCarbonReduction = Number(actualCarbonReduction);
    }

    const updatedProject = await project.save();
    const populatedProject = await Project.findById(updatedProject._id).populate(
      'createdBy',
      'name email role'
    );

    res.status(200).json({
      status: 'success',
      message: 'Project progress updated successfully',
      project: populatedProject
    });
  } catch (error) {
    console.error('[Update Progress Error]', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to update project progress'
    });
  }
};

/**
 * @desc    Delete a project
 * @route   DELETE /api/projects/:id
 * @access  Private
 */
export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found'
      });
    }

    if (!canAccessDepartment(req.user, project.department)) {
      return res.status(403).json({ status: 'error', message: 'Access denied for this department.' });
    }

    await project.deleteOne();

    res.status(200).json({
      status: 'success',
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('[Delete Project Error]', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to delete project'
    });
  }
};
