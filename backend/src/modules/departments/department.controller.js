import {
  createDepartment,
  listDepartments,
  getDepartmentById,
  updateDepartment,
  toggleDepartmentStatus,
} from './department.service.js';
import { successResponse } from '../../utils/apiResponse.js';

export const postDepartment = async (req, res, next) => {
  try {
    const dept = await createDepartment(req.user.hospitalId, req.body);
    return successResponse(res, 'Department created successfully', dept, 201);
  } catch (error) {
    next(error);
  }
};

export const getDepartments = async (req, res, next) => {
  try {
    const depts = await listDepartments(req.user.hospitalId, req.query);
    return successResponse(res, 'Departments retrieved successfully', depts, 200);
  } catch (error) {
    next(error);
  }
};

export const getDepartment = async (req, res, next) => {
  try {
    const dept = await getDepartmentById(req.user.hospitalId, req.params.id);
    return successResponse(res, 'Department retrieved successfully', dept, 200);
  } catch (error) {
    next(error);
  }
};

export const putDepartment = async (req, res, next) => {
  try {
    const dept = await updateDepartment(req.user.hospitalId, req.params.id, req.body);
    return successResponse(res, 'Department updated successfully', dept, 200);
  } catch (error) {
    next(error);
  }
};

export const patchDepartmentStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const dept = await toggleDepartmentStatus(req.user.hospitalId, req.params.id, isActive);
    return successResponse(res, 'Department status updated successfully', dept, 200);
  } catch (error) {
    next(error);
  }
};
