(function() {
    //
    // TODO: Check for fetch API, promises, IndexedDB support
    //

    /*
     * This is manifest data with all metadata.
     */
    var manifest = {},
        settings = new Dexie('et_settings');

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

    function downloadFile(url, message) {
        return new Promise(async function(resolve, reject) {
            /*
            * Large part of this function was taken from https://javascript.info/fetch-progress
            */
            let response = await fetch(url);

            if (response.status !== 200 && response.status !== 304) {
                reject(`Could not download file ${url}`);
                return;
            }

            const reader = response.body.getReader();

            const contentLength = +response.headers.get('Content-Length');
            updateProgressScreen(message, contentLength);

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

    function fillLanguages(parentElement, languages) {
        emptyElement(parentElement);

        languages.forEach(function(language) {
            let languageElement = document.createElement('option');
            languageElement.textContent = language;
            parentElement.appendChild(languageElement);
        });
    }

    function fillLanguagesByAlpha(parentElement, languages) {
        languages.sort();
        fillLanguages(parentElement, languages);
    }

    function fillLanguagesBySize(parentElement, languages) {
        languages.sort(compareLanguagesBySize);
        fillLanguages(parentElement, languages);
    }

    function fillAvailableLanguagesSorted(parentElement, languages) {
        switch (document.querySelector('input[name="sortBy"]:checked').value) {
            case 'alpha': fillLanguagesByAlpha(parentElement, languages); break;
            case 'size':  fillLanguagesBySize(parentElement, languages);  break;
        }
    }

    function compareLanguagesBySize(el1, el2) {
        let size1 = el1 in manifest ? manifest[el1].size : 0,
            size2 = el2 in manifest ? manifest[el2].size : 0;
        return size2 - size1;
    }

    function fillAvailableTargetLanguages() {
        let sourceLanguageElement = document.querySelector('#availableLanguageFrom'),
            targetLanguageElement = document.querySelector('#availableLanguageTo');

        let sourceLanguage = sourceLanguageElement.value;
        let targetLanguages = sourceLanguage in manifest ? Object.keys(manifest[sourceLanguage].files) : [];

        fillAvailableLanguagesSorted(targetLanguageElement, targetLanguages);
    }

    function updateExchangeAvailableLanguagesButtonState() {
        let sourceLanguageElement = document.querySelector('#availableLanguageFrom'),
            targetLanguageElement = document.querySelector('#availableLanguageTo'),
            exchangeLanguagesButton = document.querySelector('#exchangeAvailableLanguagePair');

        let sourceLanguage = sourceLanguageElement.value,
            targetLanguage = targetLanguageElement.value;

        let exchangedLanguagePairAvailable = targetLanguage in manifest && sourceLanguage in manifest[targetLanguage].files;
        exchangeLanguagesButton.disabled = !exchangedLanguagePairAvailable;
    }

    function makeUrl(fn) {
        return ['data', fn].join('/');
    }

    function cleanText(str) {
        return str
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')  // diacritics (here and above SO:990904)
            .replace(/[\p{P}]/gu, ' ');  // all Unicode punctuation (SO:4328500)
    }

    /*
     * Initialisation of the app.
     */

    // Intialise settings database
    settings.version(1).stores({
        languages: '[source+target]'
    });

    // Download language manifest and fill list of language pairs
    downloadFile(makeUrl('manifest.min.json'), 'Getting list of languages…').then(function(data) {
        manifest = JSON.parse(data);
        let languagesFromElement = document.querySelector('#availableLanguageFrom');
        fillAvailableLanguagesSorted(languagesFromElement, Object.keys(manifest));
        fillAvailableTargetLanguages();
    });
    
    // Add handler to sort-by radio buttons
    document.querySelectorAll('input[name="sortBy"]').forEach(function(element) {
        element.addEventListener('change', function(event) {
            let sourceLanguageElement = document.querySelector('#availableLanguageFrom'),
                targetLanguageElement = document.querySelector('#availableLanguageTo');

            let sourceLanguage = sourceLanguageElement.value,
                targetLanguage = targetLanguageElement.value;

            fillAvailableLanguagesSorted(sourceLanguageElement, Object.keys(manifest));
            sourceLanguageElement.value = sourceLanguage;

            let targetLanguages = sourceLanguage in manifest ? Object.keys(manifest[sourceLanguage].files) : [];
            fillAvailableLanguagesSorted(targetLanguageElement, targetLanguages);
            targetLanguageElement.value = targetLanguage;
        });
    });

    // Add handler to available source language select
    document.querySelector('#availableLanguageFrom').addEventListener('change', function(event) {
        fillAvailableTargetLanguages();
    });

    // Add handler to available target language select
    document.querySelector('#availableLanguageTo').addEventListener('change', function(event) {
        updateExchangeAvailableLanguagesButtonState();
    });

    // Add handler to exchange button for available languages
    document.querySelector('#exchangeAvailableLanguagePair').addEventListener('click', function(event) {
        let sourceLanguageElement = document.querySelector('#availableLanguageFrom'),
            targetLanguageElement = document.querySelector('#availableLanguageTo');

        // The languages are exchanged here!
        let sourceLanguage = targetLanguageElement.value,
            targetLanguage = sourceLanguageElement.value;

        sourceLanguageElement.value = sourceLanguage;
        fillAvailableTargetLanguages();
        targetLanguageElement.value = targetLanguage;
    });

    // Add handler to language pair installation button
    document.querySelector('#addAvailableLanguagePair').addEventListener('click', function(event) {
        let sourceLanguage = document.querySelector('#availableLanguageFrom').value,
            targetLanguage = document.querySelector('#availableLanguageTo').value;

        let fileNames = manifest[sourceLanguage].files[targetLanguage];

        (function downloadTranslations(index) {
            let url = makeUrl(fileNames[index]);
            let message = `➕ ${sourceLanguage}➡${targetLanguage} [${index+1}/${fileNames.length}]`;

            downloadFile(url, message).then(function(data) {
                //if (index < fileNames.length-1) return;
                let lines = data.split(/\r?\n/);
                console.log(`Lines: ${lines.length}`);
                let message = `📖 ${sourceLanguage}➡${targetLanguage} [${index+1}/${fileNames.length}]`;
                updateProgressScreen(message, lines.length);
                lines.forEach(function(line, index) {
                    updatePercentage(index);
                    let pair = line.split(/\t/),
                        term = pair[0],
                        translation = pair[1],
                        words = cleanText(term).split(/\s+/).filter(Boolean);
                    //console.log(words);
                });

                index++;
                if (index < fileNames.length) {
                    downloadTranslations(index);
                } else {
                    finaliseTranslations();
                }
            });
        })(0);


        function finaliseTranslations() {
            settings.languages.put({
                source: sourceLanguage,
                target: targetLanguage
            });    
        }
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
