import prisma from '../../config/db.js';

export const createDepartment = async (hospitalId, data) => {
  const { name, code, description } = data;

  if (!name || !code) {
    const error = new Error('Department name and code are required');
    error.statusCode = 400;
    throw error;
  }

  const cleanCode = code.toUpperCase().trim();
  const existing = await prisma.department.findFirst({
    where: { hospitalId, code: cleanCode },
  });

  if (existing) {
    const error = new Error(`Department with code "${cleanCode}" already exists`);
    error.statusCode = 409;
    throw error;
  }

  const department = await prisma.department.create({
    data: {
      hospitalId,
      name: name.trim(),
      code: cleanCode,
      description: description ? description.trim() : null,
      isActive: true,
    },
  });

  return department;
};

export const listDepartments = async (hospitalId, query = {}) => {
  const { isActive, search } = query;

  const whereClause = {
    hospitalId,
    ...(isActive !== undefined && { isActive: isActive === 'true' || isActive === true }),
    ...(search && {
      OR: [
        { name: { contains: search.trim() } },
        { code: { contains: search.trim().toUpperCase() } },
      ],
    }),
  };

  const departments = await prisma.department.findMany({
    where: whereClause,
    include: {
      _count: {
        select: { doctors: true, appointments: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  return departments;
};

export const getDepartmentById = async (hospitalId, departmentId) => {
  const department = await prisma.department.findFirst({
    where: { id: departmentId, hospitalId },
    include: {
      doctors: {
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          schedules: { where: { isActive: true } },
        },
      },
    },
  });

  if (!department) {
    const error = new Error('Department not found');
    error.statusCode = 404;
    throw error;
  }

  return department;
};

export const updateDepartment = async (hospitalId, departmentId, data) => {
  const { name, description } = data;

  const existing = await prisma.department.findFirst({
    where: { id: departmentId, hospitalId },
  });

  if (!existing) {
    const error = new Error('Department not found');
    error.statusCode = 404;
    throw error;
  }

  const updated = await prisma.department.update({
    where: { id: departmentId },
    data: {
      ...(name && { name: name.trim() }),
      ...(description !== undefined && { description: description ? description.trim() : null }),
    },
  });

  return updated;
};

export const toggleDepartmentStatus = async (hospitalId, departmentId, isActive) => {
  const existing = await prisma.department.findFirst({
    where: { id: departmentId, hospitalId },
  });

  if (!existing) {
    const error = new Error('Department not found');
    error.statusCode = 404;
    throw error;
  }

  const updated = await prisma.department.update({
    where: { id: departmentId },
    data: { isActive: !!isActive },
  });

  return updated;
};
