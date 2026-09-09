import {
  createNewUser,
  listUsers,
  getUserById,
  updateUser,
  updateUserStatus,
} from './user.service.js';
import { successResponse } from '../../utils/apiResponse.js';

export const createUser = async (req, res, next) => {
  try {
    const user = await createNewUser(req.user.hospitalId, req.body, req.user.role);
    return successResponse(res, 'User created successfully', user, 201);
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const users = await listUsers(req.user.hospitalId, req.query);
    return successResponse(res, 'Users retrieved successfully', users, 200);
  } catch (error) {
    next(error);
  }
};

export const getUser = async (req, res, next) => {
  try {
    const user = await getUserById(req.user.hospitalId, req.params.id);
    return successResponse(res, 'User retrieved successfully', user, 200);
  } catch (error) {
    next(error);
  }
};

export const editUser = async (req, res, next) => {
  try {
    const user = await updateUser(req.user.hospitalId, req.params.id, req.body, req.user.role);
    return successResponse(res, 'User updated successfully', user, 200);
  } catch (error) {
    next(error);
  }
};

export const changeUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const user = await updateUserStatus(req.user.hospitalId, req.params.id, status);
    return successResponse(res, 'User status updated successfully', user, 200);
  } catch (error) {
    next(error);
  }
};
