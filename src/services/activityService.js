import api from './api'

//Post /api/activities/
export const createActivity = async (activityData) => {
    const response = await api.post('/activities/', activityData)
    return response.data
}

//Get /api/activities/
export const getActivities = async () => {
    const response = await api.get('/activities/')
    return response.data.data  // el objeto que devuelve es un array
}

//Get /api/activities/:id
export const getActivitiesById = async (id) => {
    const response = await api.get(`/activities/${id}/`)
    return response.data.data  // el objeto que devuelve es un array
}

// Put /api/activities/:id
export const updateActivity = async (id, activityData) => {
    const response = await api.put(`/activities/${id}/`, activityData)
    return response.data
}

// Delete /api/activities/:id
export const deleteActivity = async (id) => {
  const response = await api.delete(`/activities/${id}/`)
  return response.data
}