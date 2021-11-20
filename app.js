(function() {
    //
    // TODO: Check for fetch API, promises, IndexedDB support
    //

    /*
     * This is manifest data with all metadata.
     */
    var manifest = {};

    function updateProgressScreen(action, total) {
        document.querySelector('#progressScreen > h1').textContent = action;
        document.querySelector('#progressScreen > progress').max = total;
    }

    function updatePercentage(value) {
        var progressElement = document.querySelector('#progressScreen > progress'),
            total = progressElement.max,
            percentage = `${(value / total * 100).toFixed()} %`;
        progressElement.value = value;
        document.querySelector('#progressScreen > label').textContent = percentage;
    }

    function downloadFile(url) {
        return new Promise(async function(resolve, reject) {
            /*
            * Large part of this function was taken from https://javascript.info/fetch-progress
            */
            let response = await fetch(url);
            const reader = response.body.getReader();

            const contentLength = +response.headers.get('Content-Length');
            updateProgressScreen('Getting list of languages…', contentLength);

            let receivedLength = 0;
            let chunks = [];

            while (true) {
                const {done, value} = await reader.read();

                if (done) {
                    break;
                }

                chunks.push(value);
                receivedLength += value.length;
                updatePercentage(receivedLength);
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

    function emptyElement(element) {
        while(element.firstChild) {
            element.remove(element.lastChild);
        }
    }

    function fillAvailableLanguages1(languages) {
        let availableLanguages1 = document.querySelector('#availableLanguageFrom');
        emptyElement(availableLanguages1);

        languages.forEach(function(language) {
            let languageElement = document.createElement('option');
            languageElement.textContent = language;
            availableLanguages1.appendChild(languageElement);
        });
    }

    function fillAvailableLanguages1ByAlpha(languages) {
        languages.sort();
        fillAvailableLanguages1(languages);
    }

    function compareLanguagesBySize(el1, el2) {
        return manifest[el2].size - manifest[el1].size;
    }

    function fillAvailableLanguages1BySize(languages) {
        languages.sort(compareLanguagesBySize);
        fillAvailableLanguages1(languages);
    }

    function fillAvailableLanguages1Sorted(languages) {
        switch (document.querySelector('input[name="sortBy"]:checked').value) {
            case 'alpha':
                fillAvailableLanguages1ByAlpha(languages);
                break;

            case 'size':
                fillAvailableLanguages1BySize(languages);
                break;
        }

        emptyElement(document.querySelector('#availableLanguageTo'));
    }

    /*
     * Initialisation of the app.
     */

    // Download language manifest and fill list of language pairs
    downloadFile('data/manifest.min.json').then(function(data) {
        manifest = JSON.parse(data);
        fillAvailableLanguages1Sorted(Object.keys(manifest));
    });
    
    // Add listeners for sort-by radio buttons
    document.querySelectorAll('input[name="sortBy"]').forEach(function(element) {
        element.addEventListener('change', function(event) {
            fillAvailableLanguages1Sorted(Object.keys(manifest));
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
