import axios from "axios";

const api_url = process.env.REACT_APP_API_URL || 'http://localhost:5000'

const api = axios.create({
    baseURL : `${api_url}/api`
})

export default api
