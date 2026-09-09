import { useEffect, useState } from "react"
import { serverUrl } from "../App"
import axios from "axios"
import { useDispatch } from "react-redux"
import { setUserData } from "../redux/userSlice"

const useGetCurrentUser = () => {
    let dispatch = useDispatch()
    const [loading, setLoading] = useState(true)

    useEffect(()=>{
        const fetchUser = async () => {
            try {
                let result = await axios.get(serverUrl + "/api/user/currentuser" , {withCredentials:true})
                dispatch(setUserData(result.data))
            } catch (error) {
                console.log(error)
                dispatch(setUserData(null))
            } finally {
                setLoading(false)
            }
        }
        fetchUser()
    },[])

    return loading
}

export default useGetCurrentUser