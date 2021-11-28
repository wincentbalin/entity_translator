(function() {
    /*
     * This is manifest data with all metadata.
     */
    var manifest;

    /*
     * These are installed language pairs.
     */
    var installedLanguagePairs = {};

    /*
     * Show progress.
     */
    var showProgress = function(title, loaded, total) {
        var progressTitle = document.querySelector('#progress > h1');
        var progressBar = document.querySelector('#progress > progress');
        var progressLabel = document.querySelector('#progress > label');

        progressTitle.textContent = title;

        if (typeof loaded === 'undefined') {  // indeterminate value
            progressBar.removeAttribute('value');
            progressLabel.textContent = '';
        } else {
            progressBar.value = loaded;
            progressBar.max = total;
            progressLabel.textContent = '' + (loaded / total * 100).toFixed() + ' %';
        }

        window.location.hash = '#progress';
    }

    /*
     * Show error.
     */
    var showError = function(errorMessage) {
        document.querySelector('#errorMessage').textContent = errorMessage;
        window.location.hash = '#error';
    };

    /*
     * Load file.
     */
    var loadFile = function(url, description, callback) {
        var request = new XMLHttpRequest();
        
        request.onerror = function(event) {
            showError('Transfer error when ' + description);
        }
        request.onprogress = function(event) {
            if (event.lengthComputable) {
                showProgress(description, event.loaded, event.total);
            } else {
                showProgress(description);
            }
        };
        request.onreadystatechange = function(event) {
            if (request.readyState === XMLHttpRequest.DONE) {
                // status == 0 means successful load of a local file in Firefox
                var status = request.status;
                if ((status >= 200 && status < 400) || status === 0) {
                    callback(request.responseText);
                } else {
                    showError('Server error when ' + description);
                }
            }
        }

        request.open('GET', url);
        request.send();
    };

    /*
     * No language pairs installed.
     */
    var noLanguagePairsInstalled = function() {
        return Object.keys(installedLanguagePairs).length === 0;
    };

    /*
     * Remove child elements.
     */
    var removeChildElements = function(parentElement) {
        while (parentElement.firstChild) {
            parentElement.removeChild(parentElement.lastChild);
        }
    };

    /*
     * Update element options.
     */
    var updateElementOptions = function(parentElement, options) {
        removeChildElements(parentElement);

        options.forEach(function(option) {
            var optionElement = document.createElement('option');
            optionElement.textContent = option;
            parentElement.appendChild(optionElement);
        });
    };

    /*
     * Compare languages by size in manifest.
     */
    var compareBySize = function(language1, language2) {
        var size1 = language1 in manifest ? manifest[language1].size : 0;
        var size2 = language2 in manifest ? manifest[language2].size : 0;
        return size2 - size1;
    };

    /*
     * Update languages element in add language screen.
     */
    var updateAvailableLanguagesElement = function(element, languages) {
        switch (document.querySelector('input[name="sortBy"]:checked').value) {
            case 'alpha': languages.sort();              break;
            case 'size':  languages.sort(compareBySize); break;
        }
        updateElementOptions(element, languages);
    };

    /*
     * Update target languages element in add language screen.
     */
    var updateAvailableTargetLanguagesElement = function(sourceLanguageElement, targetLanguageElement) {
        var targetLanguages = Object.keys(manifest[sourceLanguageElement.value].files);
        updateAvailableLanguagesElement(targetLanguageElement, targetLanguages);
    }

    /*
     * Update available languages.
     */
    var updateAvailableLanguages = function() {
        var sourceLanguages = Object.keys(manifest);
        var sourceLanguageElement = document.querySelector('#availableSourceLanguage');
        updateAvailableLanguagesElement(sourceLanguageElement, sourceLanguages);

        var targetLanguageElement = document.querySelector('#availableTargetLanguage');
        updateAvailableTargetLanguagesElement(sourceLanguageElement, targetLanguageElement);
    };

    /*
     * Update installed languages.
     */
    var updateInstalledLanguages = function() {
        //
    };

    /*
     * This is the entry point.
     */

    /*
     * Check for IndexedDB support.
     */
    if (!('indexedDB' in window)) {
        showError('IndexedDB unsupported');
        return;
    }
    
    /*
     * Set sort options for available languages.
     */
    document.querySelectorAll('input[name="sortBy"]').forEach(function(element) {
        element.onclick = function(event) {
            updateAvailableLanguages();
        };
    });

    /*
     * Load manifest.
     */
    loadFile('data/manifest.min.json', 'loading manifest', function(contents) {
        manifest = JSON.parse(contents);
        updateAvailableLanguages();

        if (noLanguagePairsInstalled()) {
            window.location.hash = '#addLanguage';
        } else {
            window.location.hash = '#search';
        }
    });



// Here we end ES5 implementation
return;

    //
    // TODO: Check for fetch API, promises, IndexedDB support
    //
    /*
     * This is manifest data with all metadata.
     */
    /*
    var manifest = {},
        installed = {},
        settings = new Dexie('et_settings'),
        fts;

    function updateProgressScreen(action, total) {
        document.querySelector('#progressScreen > h1').textContent = action;
        document.querySelector('#progressScreen > progress').max = total;
        updatePercentage(0);
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
           /*
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
            element.removeChild(element.lastChild);
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
            .replace(/[\p{P}]/gu, ' ')  // all Unicode punctuation (SO:4328500)
            .toLowerCase();
    }

    function updateExchangeLanguagesButtonState() {
        let sourceLanguageElement = document.querySelector('#languageFrom'),
            targetLanguageElement = document.querySelector('#languageTo'),
            exchangeLanguagesButton = document.querySelector('#exchangeLanguagePair');

        let sourceLanguage = sourceLanguageElement.value,
            targetLanguage = targetLanguageElement.value;

        let exchangedLanguagePairAvailable = targetLanguage in installed && sourceLanguage in installed[targetLanguage];
        exchangeLanguagesButton.disabled = !exchangedLanguagePairAvailable;
    }

    function fillInstalledTargetLanguages() {
        let sourceLanguageElement = document.querySelector('#languageFrom'),
            targetLanguageElement = document.querySelector('#languageTo');

        let sourceLanguage = sourceLanguageElement.value;
        let targetLanguages = sourceLanguage in installed ? Object.keys(installed[sourceLanguage]) : [];

        fillLanguagesByAlpha(targetLanguageElement, targetLanguages);
    }

    function removeLanguagePair(event) {
        let button = event.target;
        let pair = button.parentElement.firstChild.textContent.split('➡');
        
        let ftsName = `et_${pair.join('_')}`;
        Dexie.delete(ftsName);

        settings.languages.delete(pair);
        updateInstalledLanguages();
    }

    function fillInstalledLanguagesList() {
        let installedLanguagesElement = document.querySelector('#removeLanguageScreen > ul');
        if (installedLanguagesElement.firstElementChild) {
            emptyElement(installedLanguagesElement);
        }

        let sourceLanguages = Object.keys(installed);
        sourceLanguages.sort();

        sourceLanguages.forEach(function(sourceLanguage) {
            let targetLanguages = Object.keys(installed[sourceLanguage]);
            targetLanguages.sort();

            targetLanguages.forEach(function(targetLanguage) {
                let entryElement = document.createElement('li');
                let textElement = document.createElement('span');
                textElement.textContent = `${sourceLanguage}➡${targetLanguage}`;
                entryElement.appendChild(textElement);
                let buttonElement = document.createElement('button');
                buttonElement.textContent = '➖';
                buttonElement.addEventListener('click', removeLanguagePair);
                entryElement.appendChild(buttonElement);
                installedLanguagesElement.appendChild(entryElement);
            });
        });
    }

    function updateInstalledLanguages() {
        settings.languages.toArray(function(languages) {
            installed = {};
            languages.forEach(function(entry) {
                let sourceLanguage = entry.source,
                    targetLanguage = entry.target;

                if (sourceLanguage in installed) {
                    installed[sourceLanguage][targetLanguage] = true;
                } else {
                    let targetLanguages = {};
                    targetLanguages[targetLanguage] = true;
                    installed[sourceLanguage] = targetLanguages;
                }
            });

            let sourceLanguageElement = document.querySelector('#languageFrom'),
                targetLanguageElement = document.querySelector('#languageTo');

            let sourceLanguage = sourceLanguageElement.value,
                targetLanguage = targetLanguageElement.value;

            let sourceLanguages = Object.keys(installed);
            fillLanguagesByAlpha(sourceLanguageElement, sourceLanguages);
            if (sourceLanguage in installed) {
                sourceLanguageElement.value = sourceLanguage;
            }
            fillInstalledTargetLanguages();
            if (sourceLanguage in installed && targetLanguage in installed[sourceLanguage]) {
                targetLanguageElement.value = targetLanguage;
            }

            updateExchangeLanguagesButtonState();
            fillInstalledLanguagesList();
        });
    }

    function unique(arr) {  // from SO:11688692
        var seen = {};
        return arr.filter(function(value) {
            return seen[value] = !seen.hasOwnProperty(value);
        });
    }

    /*
     * Initialisation of the app.
     */
    /*

    // Initialise settings database
    settings.version(1).stores({
        languages: '[source+target]'
    });
    updateInstalledLanguages();

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

        let ftsName = `et_${sourceLanguage}_${targetLanguage}`;
        fts = new Dexie(ftsName);
        fts.version(1).stores({
            bloomFilter: 'id',
            words: '++id, &word',
            terms: '++id',
            term_words: 'word_id, term_id',
            alphabet: '&char'
        });

        let bloomFilter = new BloomFilter(32 * 1046576, 22);
        let alphabet = {};
        let languageModel = {};

        (function downloadTranslations(index) {
            let url = makeUrl(fileNames[index]);
            let message = `➕ ${sourceLanguage}➡${targetLanguage} [${index+1}/${fileNames.length}]`;

            downloadFile(url, message).then(function(data) {
                //if (index < fileNames.length-1) return;
                let lines = data.split(/\r?\n/);
                console.log(`Lines: ${lines.length}`);
                let message = `📖 ${sourceLanguage}➡${targetLanguage} [${index+1}/${fileNames.length}]`;
                updateProgressScreen(message, lines.length);
                fts.transaction('rw', fts.terms, fts.words, fts.term_words, function() {
                    lines.forEach(function(line, index) {
                        updatePercentage(index);
                        let pair = line.split(/\t/),
                            term = pair[0],
                            translation = pair[1],
                            words = cleanText(term).split(/\s+/).filter(Boolean);

                        // Store term with translation and get its ID
                        fts.terms.add({
                            term: term,
                            translation: translation
                        }).then(function(term_id) {
                            words.forEach(function(word) {
                                /*
                                fts.words.get({word: word}).then(function(wordData) {
                                    if (typeof wordData === 'undefined') {
                                        fts.words.put({
                                            word: word,
                                            count: 1
                                        }).then(function(word_id) {
                                            fts.term_words.add({
                                                word_id: word_id,
                                                term_id: term_id
                                            });
                                        })
                                    } else {
                                        wordData.count++;
                                        fts.term_words.put({
                                            word_id: wordData.id,
                                            term_id: term_id
                                        });
                                    }
                                })
                                */
                                /*
                                // Get word ID
                                if (bloomFilter.test(word) && word in languageModel) {
                                    //
                                } else {
                                    //fts.words.add()
                                }

                                // Add word to language model
                                if (word in languageModel) {
                                    languageModel[word]++;
                                } else {
                                    languageModel[word] = 1;
                                }
                                */

                                // Add to Bloom filter
                                /*
                                bloomFilter.add(word);
                            });
                        });

                        // Update alphabet
                        words.filter(function(word) {
                            return word.length >= 3;
                        }).forEach(function(word) {
                            // Count characters
                            word.split('').forEach(function(char) {
                                if (char in alphabet) {
                                    alphabet[char]++;
                                } else {
                                    alphabet[char] = 1;
                                }
                            });
                        });
                    });
                }).then(function() {
                    index++;
                    if (index < fileNames.length) {
                        downloadTranslations(index);
                    } else {
                        finaliseTranslations();
                    }
                });
            });
        })(0);

        function finaliseTranslations() {
            // Prune alphabet
            Object.keys(alphabet).forEach(function(char) {
                if (alphabet[char] < 10) {
                    delete alphabet[char];
                }
            });
            console.log('Alphabet:', alphabet);
            // Store alphabet
            fts.alphabet.bulkPut(Object.keys(alphabet).map(function(char) {
                return {char: char, count: alphabet[char]};
            }));
            // Store Bloom filter
            fts.bloomFilter.put({
                id: 0,
                json: JSON.stringify([].slice.call(bloomFilter.buckets))
            });

            // Add language pair to installed
            settings.languages.put({
                source: sourceLanguage,
                target: targetLanguage
            });

            updateInstalledLanguages();
        }
    });

    // Add handler to installed source language select
    document.querySelector('#languageFrom').addEventListener('change', function(event) {
        fillInstalledTargetLanguages();
    });

    // Add handler to available target language select
    document.querySelector('#languageTo').addEventListener('change', function(event) {
        updateExchangeLanguagesButtonState();
    });

    // Add handler to exchange button for installed languages
    document.querySelector('#exchangeLanguagePair').addEventListener('click', function(event) {
        let sourceLanguageElement = document.querySelector('#languageFrom'),
            targetLanguageElement = document.querySelector('#languageTo');

        // The languages are exchanged here!
        let sourceLanguage = targetLanguageElement.value,
            targetLanguage = sourceLanguageElement.value;

        sourceLanguageElement.value = sourceLanguage;
        fillInstalledTargetLanguages();
        targetLanguageElement.value = targetLanguage;
    });*/
})();
