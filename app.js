(function() {
    //
    // TODO: Check for fetch API, promises, IndexedDB support
    //
    function updatePercentage(value, total) {
        var percentage = `${(value / total * 100).toFixed()} %`;
        document.querySelector('#progressValue').textContent = percentage;
    }

    function downloadFile(url) {
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
                updatePercentage(receivedLength, contentLength);
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

    // Download translations manifest and fill list of language pairs
    downloadFile('data/manifest.min.json').then(function(data) {
        let manifest = JSON.parse(data);
        let availableLanguages = document.querySelector('#availableLanguages');

        let languagesFrom = Object.keys(manifest);
        languagesFrom.forEach(function(languageFrom) {
            let languagesTo = Object.keys(manifest[languageFrom].files);
            languagesTo.forEach(function(languageTo) {
                let languageElement = document.createElement('option');
                if (languageTo in manifest && languageFrom in manifest[languageTo].files) {
                    languageElement.textContent = `${languageFrom}-${languageTo}, ${languageTo}-${languageFrom}`;
                } else {
                    languageElement.textContent = value = `${languageFrom}-${languageTo}`;
                }
                availableLanguages.appendChild(languageElement);
            });
        });
    });

    /*
    if (!window.indexedDB) {
        console.error('IndexedDB is not supported!');
        return;
    }

    var version = 1,
        db,
        request = window.indexedDB.open('et', version);
    
    function databaseVersionChanged(event) {
        db.close();
        console.log('A new version of this page is ready. Please reload or close this tab!');
    }

    request.onerror = function(event) {
        console.error('Using IndexedDB is not allowed!');
        console.error('Error code: ' + event.target.errorCode);
    };

    request.onsuccess = function(event) {
        db = event.target.result;
        db.onversionchange = databaseVersionChanged;
    };

    request.onblocked = function(event) {
        console.error('Please close all other tabs with this site open!');
    };

    request.onupgradeneeded = function(event) {
        var store = event.currentTarget.result.createObjectStore('words', {
            keyPath: 'id',
            autoIncrement: true
        });

        store.createIndex('word', 'word', {
            unique: true
        });

        event.currentTarget.result.onversionchange = databaseVersionChanged;
    };

    // Load manifest file and process it
    var loadFile = function(url) {
        var request = new XMLHttpRequest();
        request.onprogress = function(event) {
            //
        };

        request.onreadystatechange = function(event) {
            //
        };

        request.ontimeout = function(event) {
            //
        };
    };
    */
    /*
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
                return;

            default:
                console.error('Server error');
                return;
        }

        var reader = response.body.getReader();

    })
    .catch(function(error) {
        console.error(error);
    });
    */

})();
