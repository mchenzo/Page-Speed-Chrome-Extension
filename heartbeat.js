var axios = require("axios")

axios.get("https://demo.way2b1.com/monoserver/heartbeat")
	.then(function(response){
		console.log('response', response)
	})