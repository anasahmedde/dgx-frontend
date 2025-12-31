import { httpFactory } from "./httpFactory";
import { API } from "./config";
import { enc } from "./paginate";
import { safeGet } from "./httpFactory";


const http = httpFactory({ baseURL: API.DVSG });

/**
 * Group linked videos
 * Your earlier request was like: /group/Pepsi%20Chiller%20Handle/videos
 */
export const listGroupVideosByName = (groupName) =>
  http.get(`/group/${enc(groupName)}/videos`);

export async function listGroupVideoNames(groupName) {
  const res = await listGroupVideosByName(groupName);
  const items = res?.data?.items || [];
  return items.map((v) => v?.video_name ?? v?.name ?? v).filter(Boolean);
}

// Your component complained about setGroupVideosByNames missing:
export const setGroupVideosByNames = (groupName, videoNames = []) =>
  http.post(`/group/${enc(groupName)}/videos`, { video_names: videoNames });

export async function getDeviceTemperatureSeries(mobileId, days = 30, bucket = "day") {
  return safeGet(`/device/${encodeURIComponent(mobileId)}/temperature_series`, { days, bucket });
}
