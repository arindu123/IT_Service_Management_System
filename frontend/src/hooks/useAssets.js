import { useCallback,useEffect,useMemo,useState } from "react";
import assetService from "../services/assetService";
export default function useAssets(errorMessage="Failed to load assets"){
  const [assets,setAssets]=useState([]);const [filters,setFilters]=useState({search:"",category:"",condition:"",status:"",location:""});const [loading,setLoading]=useState(true);const [error,setError]=useState("");
  const load=useCallback(()=>assetService.list(),[]);
  useEffect(()=>{let active=true;load().then((items)=>{if(active){setAssets(items);setError("");}}).catch((err)=>{if(active)setError(err.response?.data?.message||errorMessage);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[errorMessage,load]);
  const filteredAssets=useMemo(()=>assets.filter((asset)=>{const term=filters.search.trim().toLowerCase();const searchable=[asset.itemNumber,asset.assetId,asset.serialNumber,asset.brand,asset.model,asset.customDeviceType,asset.assignedTo?.name,asset.assignedUserSnapshot?.name,asset.location].filter(Boolean).join(" ").toLowerCase();const condition=assetCondition(asset);return(!term||searchable.includes(term))&&(!filters.category||asset.deviceType===filters.category)&&(!filters.condition||condition===filters.condition)&&(!filters.status||(asset.status||"active")===filters.status)&&(!filters.location||asset.location===filters.location);}),[assets,filters]);
  return{assets,filteredAssets,filters,setFilters,loading,error,setError,reload:async()=>{const items=await load();setAssets(items);return items;}};
}
export function assetCondition(asset){if(["damaged"].includes(asset.status))return"poor";if(["under_repair"].includes(asset.status))return"maintenance";if(["retired","destroyed"].includes(asset.status))return"retired";return"good";}
