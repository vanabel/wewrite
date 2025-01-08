import { requestUrl } from "obsidian";

export function getPublicIpAddress(){
    return requestUrl('https://httpbin.org/ip')
    .then((response) => {
        // console.log(`response:`, response);
        return response.json.origin
    })
    .then((data) => {
        return data.origin
    })
}


