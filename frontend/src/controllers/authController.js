import { getCurrentUser, getUsers, loginUser } from "../models/authModel";

export const handleLogin = async ({ email, password }) => {
  const data = await loginUser({ email, password });

  if (data?.token) {
    localStorage.setItem("token", data.token);
  }

  if (data?.user) {
    localStorage.setItem("user", JSON.stringify(data.user));
  }

  return data;
};

export const handleLoadCurrentUser = async () => {
  const data = await getCurrentUser();

  if (data?.user) {
    localStorage.setItem("user", JSON.stringify(data.user));
  }

  return data;
};

export const handleLogout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export const handleGetUsers = async () => {
  const data = await getUsers();
  return data;
};