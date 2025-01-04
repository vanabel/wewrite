import { requestUrl } from "obsidian";

export function getPublicIpAddress(){
    return requestUrl('https://httpbin.org/ip')
    .then((response) => {
        return response.json()
    })
    .then((data) => {
        return data.origin
    })
}


