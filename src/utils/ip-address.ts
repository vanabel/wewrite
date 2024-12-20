
export function getPublicIpAddress(){
    return fetch('https://httpbin.org/ip')
    .then((response) => {
        console.log(`response: ${response}`);
        
        return response.json()
    })
    .then((data) => {
        console.log(`data: ${data}`);
        
        return data.origin
    })
}


