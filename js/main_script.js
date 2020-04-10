

function request(url) {
	console.log('requesting url:');
	console.log(url);
  return new Promise(function (resolve, reject) {
    const xhr = new XMLHttpRequest();
    xhr.timeout = 2000;
    xhr.onreadystatechange = function(e) {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          resolve(xhr.response)
        } else {
          reject(xhr.status)
        }
      }
    }
    xhr.ontimeout = function () {
      reject('timeout')
    }
    xhr.open('get', url, true)
    xhr.send();
  });
}

function requestArrayBuffer(url) {
	console.log('requesting AB url:');
	console.log(url);
  return new Promise(function (resolve, reject) {
    const xhr = new XMLHttpRequest();
    xhr.timeout = 2000;
    xhr.onreadystatechange = function(e) {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          resolve(xhr.response)
        } else {
			console.log("rejecting with " + xhr.status);
			reject(xhr.status)
        }
      }
    }
    xhr.ontimeout = function () {
      reject('timeout')
    }
	xhr.responseType = 'arraybuffer';
    xhr.open('get', url, true)
    xhr.send();
  });
}

var imagePos = 0;

function addImageToDoc(doc){
	return (img_url)=>{
			console.log('image: ');
			console.log(img_url);
			var xPos = imagePos%3;
			var yPos = Math.floor(imagePos/3);
			imagePos = (imagePos + 1);	
			doc.image(img_url, 10 + xPos * 167, 10 + yPos * 243, {width: 166});
			if(imagePos >= 9)
			{
				doc.addPage();
				imagePos = 0;
			}
	};
}

function getImageUrl(cardNameOrId){
	return ()=>{
		return request('https://db.ygoprodeck.com/api/v6/cardinfo.php?name=' + cardNameOrId)
		.catch((function(name){return (error)=>request('https://db.ygoprodeck.com/api/v6/cardinfo.php?id=' + name)})(cardNameOrId))
		.catch(function(name){
			return (error)=>
			{
				while(name.length < 8){
				name = '0' +name;
				}
			return request('https://db.ygoprodeck.com/api/v6/cardinfo.php?id=' + name);}
		}(cardNameOrId))
		.then(function (result){
			var data = JSON.parse(result);
			console.log('requesting result');
			console.log(data);
			return requestArrayBuffer(data[0].card_images[0].image_url);
		});
	};
}

function getLines(){
	return document.getElementById("decklist_input").value.split('\n');
}

function generateProxies(){
	imagePos = 0;
	
	// create a document the same way as above
	const doc = new PDFDocument;

	// pipe the document to a blob
	const stream = doc.pipe(blobStream());
	stream.on('finish', function() {
		/*var iframe = document.querySelector('iframe');*/
		  // get a blob you can do whatever you like with
		const blob = stream.toBlob('application/pdf');
		saveAs(blob, "download.pdf");	 
	});


	var lines = getLines();
	var overallProcess = Promise.resolve();
	
	for(var i = 0; i < lines.length; i++){
		if(/^\/\//.test(lines[i]) || /^#/.test(lines[i]) || /^!/.test(lines[i])){
			console.log("skipping comment " + lines[i]);
			continue;
		}

		
		//var regex_id_nr = 
		var regex_name = /^(?:([1-9][0-9]*) )?([A-Za-z0-9?!,:"\/-@]+(?: [A-Za-z0-9?!,:"\/-@]+)*)/;
		var regex_result = regex_name.exec(lines[i]);
		if(regex_result){
			var number = regex_result[1] === undefined ? 1 : parseInt(regex_result[1]);
			console.log(lines[i]);
			console.log(regex_result);
			console.log("number: " + number);
			overallProcess = overallProcess.then(getImageUrl(regex_result[2]));
			overallProcess = overallProcess.then(function(innerNumber){return (img)=>Promise.all([...Array(innerNumber).keys()].map(i => addImageToDoc(doc)(img)))}(number));
	}
	}
	
	overallProcess = overallProcess
		.then(function(){doc.end();})
		.catch(console.log.bind(console));
		//doc.end();
	
}



