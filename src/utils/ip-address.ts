import { requestUrl } from "obsidian";

export async function getPublicIpAddress():Promise<string> {
    return new Promise((resolve, reject) => {
		requestUrl('https://httpbin.org/ip')
		.then((response) => {
			console.log("=> Public IP address:", response.json.origin);
			
			resolve(response.json.origin)
		}).catch((error) => {
			console.error("Error fetching public IP address:", error);
			reject("Failed to fetch public IP address: " + error);
		})
    }) 
}


