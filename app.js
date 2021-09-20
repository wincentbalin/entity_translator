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
