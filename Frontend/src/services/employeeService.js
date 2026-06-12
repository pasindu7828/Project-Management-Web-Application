import axios from 'axios';

const employeeApi = axios.create({
  baseURL: 'http://localhost:8090/api/v1/employee',
  withCredentials: true,
});
const base = import.meta.env.VITE_API_BASE_URL;
export const getAllEmployees = async () => {
  try {
    const response = await employeeApi.get(`${base}/api/v1/employee/getAllEmployee`, { withCredentials: true });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getSingleEmployeeById = async (id) => {
  try {
    const response = await employeeApi.get(`${base}/api/v1/employee/getSingleEmployeeByID/${id}`, { withCredentials: true });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateEmployee = async (id, employeeData) => {
  try {
    const response = await employeeApi.patch(`${base}/api/v1/employee/updateEmployee/${id}`, { withCredentials: true },employeeData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const removeEmployee = async (id) => {
  try {
    const response = await employeeApi.delete(`${base}/api/v1/employee/RemoveEmployee/${id}`,{ withCredentials: true });
    console.log(response.data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createEmployee = async (employeeData) => {
  try {
    const response = await employeeApi.post(`${base}/api/v1/employee/addEmployee`, employeeData);
    return response.data;
  } catch (error) {
    throw error;
  }
};
