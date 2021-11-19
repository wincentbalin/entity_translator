(function() {
    var downloadFile = function(url) {
        return new Promise(async function(resolve, reject) {
            /*
            * Large part of this function was taken from https://javascript.info/fetch-progress
            */
            let response = await fetch(url);
            const reader = response.body.getReader();

            const contentLength = +response.headers.get('Content-Length');

            let progress = document.querySelector('#progress');
            progress.value = 0;
            progress.max = contentLength;

            let receivedLength = 0;
            let chunks = [];

            while (true) {
                const {done, value} = await reader.read();

                if (done) {
                    break;
                }

                chunks.push(value);
                receivedLength += value.length;
                progress.value = receivedLength;
            }

            let chunksAll = new Uint8Array(receivedLength);
            let position = 0;
            chunks.forEach(function(chunk) {
                chunksAll.set(chunk, position);
                position += chunk.length;
            });

            let result = new TextDecoder('utf-8').decode(chunksAll);
            resolve(result);
        });
    }

    downloadFile('data/manifest.min.json').then(function(result) {
        console.log(result.length);
        var json = JSON.parse(result);
        console.log(json);
    });

    if (!window.indexedDB) {
        console.error('IndexedDB is not supported!');
        return;
    }

    // Load manifest file and process it
    fetch('data/manifest.min.json', {
        'headers': {
            'If-Modified-Since': 'Tue, 25 Aug 2021 20:29:00 GMT'
        }
    })
        .then(function(response) {
            switch (response.status) {
                case 200:
                    console.log('Process manifest...')
                    break;

                case 304:
                    console.log('Manifest is cached, do nothing');
                    break;

                default:
                    console.error('Server error');
                    break;
            }
        })
        .catch(function(error) {
            console.error(error);
        });

})();
