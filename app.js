var express = require('express');
var app = express();
var count = 1;

var templateType = process.argv[2];


var worker =
`<!DOCTYPE html> <html> <body>
	<script type="text/javascript">
		var w = new Worker("worker.js");
		w.onmessage = function(event) {
			document.body.innerHTML += event.data + "<br>";
		};
	</script>
</body> </html>`;

var plain =
`<!DOCTYPE html> <html> <body>
	<script type="text/javascript">
		var source = new EventSource("/events/");
		var count = 0;
		source.onmessage = function(e) {
			document.body.innerHTML += e.data + "<br>";
			if (++count > 10) {
				source.close();
				document.body.innerHTML += "eventSource.close()" + "<br>";
			}
		};
	</script>
</body> </html>`;

var templates = {
	"worker": worker,
	"plain": plain
}

var template;
if (templateType) {
	template = templates[templateType] || plain;
	if (!templates[templateType]) {
		console.info("Unknown template type. Using plain as default");
	} else {
		console.info(`Using ${templateType} template`);
	}
} else {
	template = plain;
	console.info("No template type given. Using plain as default");
}

app.get('/', function (req, res) {
	res.send(template); // <- Return the static template above
});

app.get('/worker.js', function (req, res) {
	res.sendFile("worker.js", { root: __dirname });
});

var clientId = 0;
var clients = {}; // <- Keep a map of attached clients

// Called once for each new client. Note, this response is left open!
app.get('/events/', function (req, res) {
	//req.socket.setTimeout(Number.MAX_VALUE);
	console.log("Client came");
	res.writeHead(200, {
		'Content-Type': 'text/event-stream', // <- Important headers
		'Cache-Control': 'no-cache',
		'Connection': 'keep-alive'
	});
	res.write('\n');
	(function (clientId) {
		clients[clientId] = res; // <- Add this client to those we consider "attached"
		req.on("close", function () {
			console.log("Client closed")
			delete clients[clientId]
		}); // <- Remove this client when he disconnects
	})(++clientId)
	
});

setInterval(function () {
	var msg = {message: `Message ${count++}`};
	console.log("Clients: " + Object.keys(clients) + " <- " + JSON.stringify(msg));
	for (clientId in clients) {
		clients[clientId].write("data: " + JSON.stringify(msg) + "\n\n"); // <- Push a message to a single attached client
	};
}, 1000);


app.listen(process.env.PORT || 8081);
