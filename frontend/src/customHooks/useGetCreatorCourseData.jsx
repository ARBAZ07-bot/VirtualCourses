import React, { useEffect } from 'react'
import { serverUrl } from '../App'
import axios from 'axios'
import { setCreatorCourseData } from '../redux/courseSlice'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'

const useGetCreatorCourseData = () => {
    const dispatch = useDispatch()
    const {userData} = useSelector(state=>state.user)

    useEffect(()=>{
        // Login se pehle ye protected route call hi mat karo
        if (!userData) return

        const getCreatorData = async () => {
          try {
            const result = await axios.get(serverUrl + "/api/course/getcreatorcourses" , {withCredentials:true})
            dispatch(setCreatorCourseData(result.data))
            console.log(result.data)
          } catch (error) {
            console.log(error)
            toast.error(error?.response?.data?.message || "Failed to fetch your courses")
          }
        }
        getCreatorData()
    },[userData])
}

export default useGetCreatorCourseData