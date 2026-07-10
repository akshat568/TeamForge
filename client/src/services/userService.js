import api from "./api";

const userService = {
  getUserProfile: (id) => api.get(`/users/${id}`),
  
  updateUserProfile: (profileData) => api.put("/users/profile", profileData),
  
  updateAvatar: (formData) => api.put("/users/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  }),
  
  updateCover: (formData) => api.put("/users/cover", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  }),
  
  getUserProjects: (id) => api.get(`/users/${id}/projects`),
  
  getUserActivity: (id) => api.get(`/users/${id}/activity`),
  
  searchUsers: (params) => {
    // Convert params object to search string
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val) searchParams.append(key, val);
    });
    return api.get(`/users/search?${searchParams.toString()}`);
  }
};

export default userService;
