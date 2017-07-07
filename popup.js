var axios = require("axios");
var ProgressBar = require("./progressbar.js");
var Chart = require('chart.js');

document.addEventListener('DOMContentLoaded', function() {

    chrome.tabs.getSelected(null, function(tab) {
        // Specify your actual API key here:
        var APIKEY = API_KEY;
        // Specify the URL you want PageSpeed results for here:
        var URL_TO_GET_RESULTS_FOR = tab.url;
        var API_URL = 'https://www.googleapis.com/pagespeedonline/v2/runPagespeed?';
        var CHART_API_URL = 'http://chart.apis.google.com/chart?';


        //event listener for the show suggestions button
        var suggestionList = document.getElementsByTagName('ul');
        var suggestionsButton = document.getElementById('suggestions');
        var hideIt = false;
        suggestionsButton.addEventListener('click', function() {
            //toggling between hiding and showing suggestions
            if (!hideIt) {
                for (var i = 0; i < suggestionList.length; i++) {
                    suggestionList[i].style.display = 'block';
                }
                hideIt = true;
            } else {
                for (var i = 0; i < suggestionList.length; i++) {
                    suggestionList[i].style.display = 'none';
                }
                hideIt = false;
            }
        });



        var graph = document.getElementsByTagName('img');
        var hideGraph = false;
        var breakdownButton = document.getElementById('breakdown');
        breakdownButton.addEventListener('click', function() {
            if (!hideGraph) {
                graph[1].style.display = 'block';
                hideGraph = !hideGraph;
            } else {
                graph[1].style.display = 'none';
                hideGraph = !hideGraph;
            }
        });




        //function that removes loading gif 
        function doneLoading() {
            var hide = document.getElementsByClassName('loading');
            hide[0].style.display = 'none';
            var loadStatus = document.getElementsByClassName('status');
            loadStatus[0].style.display = 'none';
            var prgbr = document.getElementById('container');
            prgbr.display = 'block';
        }







        function initBar() {
            var progress = document.getElementById('container');
            progress.style.display = 'block';
        }

        function initSuggestion() {
            var butt = document.getElementById('suggestions');
            butt.style.display = 'block';
        }

        function initBreakdown() {
            var butt2 = document.getElementById('breakdown');
            butt2.style.display = 'block';
        }









        //progress bar stuff
        var bar = new ProgressBar.SemiCircle(container, {
            strokeWidth: 6,
            color: '#FFEA82',
            trailColor: '#eee',
            trailWidth: 1,
            easing: 'easeInOut',
            duration: 1400,
            svgStyle: null,
            text: {
                value: '',
                alignToBottom: false
            },
            from: { color: '#FF533D' },
            to: { color: '#4FC1A3' },
            // Set default step function for all animate calls
            step: (state, bar) => {
                bar.path.setAttribute('stroke', state.color);
                var value = Math.round(bar.value() * 100);
                if (value === 0) {
                    bar.setText('');
                } else {
                    bar.setText(value);
                }

                bar.text.style.color = state.color;
            }
        });
        bar.text.style.fontFamily = '"Raleway", Helvetica, sans-serif';
        bar.text.style.fontSize = '2rem';






         function displayTopPageSpeedSuggestions(result) {
            var results = [];
            var ruleResults = result.formattedResults.ruleResults;
            for (var i in ruleResults) {
                var ruleResult = ruleResults[i];
                // Don't display lower-impact suggestions.
                if (ruleResult.ruleImpact < 3.0) continue;
                results.push({
                    name: ruleResult.localizedRuleName,
                    impact: ruleResult.ruleImpact
                });
            }
            results.sort(sortByImpact);

            var suggestions = document.createElement('h2');
            var ul = document.createElement('ul');
            for (var i = 0, len = results.length; i < len; i++) {
                var r = document.createElement('li');
                r.innerHTML = results[i].name;
                ul.insertBefore(r, null);
            }
            if (ul.hasChildNodes()) {
                var be4 = document.getElementById('breakdown');
                document.body.insertBefore(ul, be4);
            } else {
                var div = document.createElement('div');
                div.className = 'noFixes';
                div.innerHTML = 'No high impact suggestions. Bueno!';
                document.body.insertBefore(div, null);
            }
        };

        // Helper function that sorts results in order of impact.
        function sortByImpact(a, b) {
            return b.impact - a.impact;
        }




        //PIE CHART
        var RESOURCE_TYPE_INFO = [
            { label: 'JavaScript', field: 'javascriptResponseBytes', color: 'e2192c' },
            { label: 'Images', field: 'imageResponseBytes', color: 'f3ed4a' },
            { label: 'CSS', field: 'cssResponseBytes', color: 'ff7008' },
            { label: 'HTML', field: 'htmlResponseBytes', color: '43c121' },
            { label: 'Flash', field: 'flashResponseBytes', color: 'f8ce44' },
            { label: 'Text', field: 'textResponseBytes', color: 'ad6bc5' },
            { label: 'Other', field: 'otherResponseBytes', color: '1051e8' },
        ];

        function displayResourceSizeBreakdown(result) {
            var stats = result.pageStats;
            var labels = [];
            var data = [];
            var colors = [];
            var totalBytes = 0;
            var largestSingleCategory = 0;
            for (var i = 0, len = RESOURCE_TYPE_INFO.length; i < len; ++i) {
                var label = RESOURCE_TYPE_INFO[i].label;
                var field = RESOURCE_TYPE_INFO[i].field;
                var color = RESOURCE_TYPE_INFO[i].color;
                if (field in stats) {
                    var val = Number(stats[field]);
                    totalBytes += val;
                    if (val > largestSingleCategory) largestSingleCategory = val;
                    labels.push(label);
                    data.push(val);
                    colors.push(color);
                }
            }
            // Construct the query to send to the Google Chart Tools.
            var query = [
                'chs=300x140',
                'cht=p3',
                'chts=' + ['000000', 16].join(','),
                'chco=' + colors.join('|'),
                'chd=t:' + data.join(','),
                'chdl=' + labels.join('|'),
                'chdls=000000,14',
                'chp=1.6',
                'chds=0,' + largestSingleCategory,
            ].join('&');
            var i = document.createElement('img');
            var be4 = document.getElementById('analysisChart');
            i.src = 'http://chart.apis.google.com/chart?' + query;
            document.body.insertBefore(i, be4);
        };




        function runPagespeed() {
            var queryParams = {
                url: URL_TO_GET_RESULTS_FOR,
                key: APIKEY,
                screenshot: true
            }
            axios.get(API_URL, { params: queryParams }) //
                .then(function(response) {
                    console.log('response object', response);
                    doneLoading();
                    initBar();
                    initSuggestion();
                    initBreakdown();
                    bar.animate(response.data.ruleGroups.SPEED.score / 100);
                    displayTopPageSpeedSuggestions(response.data);
                    displayResourceSizeBreakdown(response.data);
                    console.log(response.data.pageStats.cssResponseBytes);
                })
                .catch(function(error) {
                    console.error('Ya done goofed!', error)
                });
        }
        // Invoke the callback that fetches results. Async here so we're sure
        // to discover any callbacks registered below, but this can be
        // synchronous in your code.
        setTimeout(runPagespeed, 0);
        //setTimeout is an event 



    });
}, false);
