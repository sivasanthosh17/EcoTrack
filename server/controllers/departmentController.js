import Department from '../models/Department.js';
import User from '../models/User.js';

/**
 * @desc    Get all departments
 * @route   GET /api/departments
 * @access  Private (All authenticated users)
 */
export const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find()
      .populate('headOfDepartment', 'name email role department')
      .sort({ createdAt: -1 });

    // Attach user count for each department
    const departmentsWithUserCount = await Promise.all(
      departments.map(async (dept) => {
        const userCount = await User.countDocuments({ department: dept.name });
        return {
          ...dept.toObject(),
          memberCount: userCount
        };
      })
    );

    res.status(200).json({
      status: 'success',
      count: departmentsWithUserCount.length,
      departments: departmentsWithUserCount
    });
  } catch (error) {
    console.error('[Get Departments Error]', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch departments'
    });
  }
};

/**
 * @desc    Create a new department
 * @route   POST /api/departments
 * @access  Private (Organization Admin only)
 */
export const createDepartment = async (req, res) => {
  try {
    const { name, code, description, headOfDepartment, location } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide both department name and code'
      });
    }

    const existingDept = await Department.findOne({ name: name.trim() });
    if (existingDept) {
      return res.status(400).json({
        status: 'error',
        message: 'A department with this name already exists'
      });
    }

    const department = await Department.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description ? description.trim() : '',
      headOfDepartment: headOfDepartment || null,
      location: location ? location.trim() : 'Main Campus'
    });

    const populatedDept = await Department.findById(department._id).populate(
      'headOfDepartment',
      'name email role'
    );

    res.status(201).json({
      status: 'success',
      message: 'Department created successfully',
      department: populatedDept
    });
  } catch (error) {
    console.error('[Create Department Error]', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to create department'
    });
  }
};

/**
 * @desc    Update department details
 * @route   PUT /api/departments/:id
 * @access  Private (Organization Admin only)
 */
export const updateDepartment = async (req, res) => {
  try {
    const { name, code, description, headOfDepartment, location } = req.body;

    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        status: 'error',
        message: 'Department not found'
      });
    }

    if (name) department.name = name.trim();
    if (code) department.code = code.trim().toUpperCase();
    if (description !== undefined) department.description = description.trim();
    if (headOfDepartment !== undefined) department.headOfDepartment = headOfDepartment || null;
    if (location !== undefined) department.location = location.trim();

    const updatedDepartment = await department.save();
    const populatedDept = await Department.findById(updatedDepartment._id).populate(
      'headOfDepartment',
      'name email role'
    );

    res.status(200).json({
      status: 'success',
      message: 'Department updated successfully',
      department: populatedDept
    });
  } catch (error) {
    console.error('[Update Department Error]', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to update department'
    });
  }
};

/**
 * @desc    Delete a department
 * @route   DELETE /api/departments/:id
 * @access  Private (Organization Admin only)
 */
export const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        status: 'error',
        message: 'Department not found'
      });
    }

    await department.deleteOne();

    res.status(200).json({
      status: 'success',
      message: 'Department deleted successfully'
    });
  } catch (error) {
    console.error('[Delete Department Error]', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to delete department'
    });
  }
};

/**
 * @desc    Assign user to a department
 * @route   PUT /api/departments/assign-user
 * @access  Private (Organization Admin only)
 */
export const assignUserToDepartment = async (req, res) => {
  try {
    const { userId, departmentName } = req.body;

    if (!userId || !departmentName) {
      return res.status(400).json({
        status: 'error',
        message: 'Please select a user and target department'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    user.department = departmentName;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: `User ${user.name} assigned to department '${departmentName}' successfully`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    });
  } catch (error) {
    console.error('[Assign User Error]', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to assign user to department'
    });
  }
};

/**
 * @desc    Get all system users (for user assignment selection)
 * @route   GET /api/departments/users
 * @access  Private (All authenticated users)
 */
export const getSystemUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ name: 1 });
    res.status(200).json({
      status: 'success',
      users
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch users'
    });
  }
};
