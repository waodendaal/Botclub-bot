/*********************************************************************
TAKE 2
 *  #### Twitter Post Fetcher v17.0.2 ####
 *  Coded by Jason Mayes 2015. A present to all the developers out there.
 *  www.jasonmayes.com
 *  Please keep this disclaimer with my code if you use it. Thanks. :-)
 *  Got feedback or questions, ask here:
 *  http://www.jasonmayes.com/projects/twitterApi/
 *  Github: https://github.com/jasonmayes/Twitter-Post-Fetcher
 *  Updates will be posted to this site.
 *********************************************************************/
(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    factory();
  }
}(this, function() {
  var domNode = '';
  var maxTweets = 20;
  var parseLinks = true;
  var queue = [];
  var inProgress = false;
  var printTime = true;
  var printUser = true;
  var formatterFunction = null;
  var supportsClassName = true;
  var showRts = true;
  var customCallbackFunction = null;
  var showInteractionLinks = true;
  var showImages = false;
  var useEmoji = false;
  var targetBlank = true;
  var lang = 'en';
  var permalinks = true;
  var dataOnly = false;
  var script = null;
  var scriptAdded = false;

  function handleTweets(tweets) {
    if (customCallbackFunction === null) {
      var x = tweets.length;
      var n = 0;
      var element = document.getElementById(domNode);
      var html = '<ul>';
      while (n < x) {
        html += '<li>' + tweets[n] + '</li>';
        n++;
      }
      html += '</ul>';
      element.innerHTML = html;
    } else {
      customCallbackFunction(tweets);
    }
  }

  function strip(data) {
    return data.replace(/<b[^>]*>(.*?)<\/b>/gi, function(a, s) {
      return s;
    }).replace(/class="(?!(tco-hidden|tco-display|tco-ellipsis))+.*?"|data-query-source=".*?"|dir=".*?"|rel=".*?"/gi, '');
  }

  function targetLinksToNewWindow(el) {
    var links = el.getElementsByTagName('a');
    for (var i = links.length - 1; i >= 0; i--) {
      links[i].setAttribute('target', '_blank');
    }
  }

  function getElementsByClassName(node, classname) {
    var a = [];
    var regex = new RegExp('(^| )' + classname + '( |$)');
    var elems = node.getElementsByTagName('*');
    for (var i = 0, j = elems.length; i < j; i++) {
      if (regex.test(elems[i].className)) {
        a.push(elems[i]);
      }
    }
    return a;
  }

  function extractImageUrl(image_data) {
    if (image_data !== undefined && image_data.innerHTML.indexOf('data-srcset') >= 0) {
      var data_src = image_data.innerHTML.match(/data-srcset="([A-z0-9%_\.-]+)/i)[0];
      return decodeURIComponent(data_src).split('"')[1];
    }
  }
  var twitterFetcher = {
    fetch: function(config) {
      if (config.maxTweets === undefined) {
        config.maxTweets = 20;
      }
      if (config.enableLinks === undefined) {
        config.enableLinks = false;
      }
      if (config.showUser === undefined) {
        config.showUser = true;
      }
      if (config.showTime === undefined) {
        config.showTime = true;
      }
      if (config.dateFunction === undefined) {
        config.dateFunction = 'default';
      }
      if (config.showRetweet === undefined) {
        config.showRetweet = false;
      }
      if (config.customCallback === undefined) {
        config.customCallback = null;
      }
      if (config.showInteraction === undefined) {
        config.showInteraction = false;
      }
      if (config.showImages === undefined) {
        config.showImages = true;
      }
      if (config.useEmoji === undefined) {
        config.useEmoji = false;
      }
      if (config.linksInNewWindow === undefined) {
        config.linksInNewWindow = true;
      }
      if (config.showPermalinks === undefined) {
        config.showPermalinks = true;
      }
      if (config.dataOnly === undefined) {
        config.dataOnly = false;
      }

      if (inProgress) {
        queue.push(config);
      } else {
        inProgress = true;
        domNode = config.domId;
        maxTweets = config.maxTweets;
        parseLinks = config.enableLinks;
        printUser = config.showUser;
        printTime = config.showTime;
        showRts = config.showRetweet;
        formatterFunction = config.dateFunction;
        customCallbackFunction = config.customCallback;
        showInteractionLinks = config.showInteraction;
        showImages = config.showImages;
        useEmoji = config.useEmoji;
        targetBlank = config.linksInNewWindow;
        permalinks = config.showPermalinks;
        dataOnly = config.dataOnly;
        var head = document.getElementsByTagName('head')[0];
        if (script !== null) {
          head.removeChild(script);
        }
        script = document.createElement('script');
        script.type = 'text/javascript';
        if (config.list !== undefined) {
          script.src = 'https://syndication.twitter.com/timeline/list?' + 'callback=__twttrf.callback&dnt=false&list_slug=' +
            config.list.listSlug + '&screen_name=' + config.list.screenName + '&suppress_response_codes=true&lang=' + (config.lang || lang) + '&rnd=' + Math.random();
        } else if (config.profile !== undefined) {
          script.src = 'https://syndication.twitter.com/timeline/profile?' + 'callback=__twttrf.callback&dnt=false' + '&screen_name=' + config.profile.screenName + '&suppress_response_codes=true&lang=' + (config.lang || lang) + '&rnd=' + Math.random();
        } else if (config.likes !== undefined) {
          script.src = 'https://syndication.twitter.com/timeline/likes?' + 'callback=__twttrf.callback&dnt=false' + '&screen_name=' + config.likes.screenName + '&suppress_response_codes=true&lang=' + (config.lang || lang) + '&rnd=' + Math.random();
        } else {
          script.src = 'https://cdn.syndication.twimg.com/widgets/timelines/' +
            config.id + '?&lang=' + (config.lang || lang) + '&callback=__twttrf.callback&' + 'suppress_response_codes=true&rnd=' + Math.random();
        }
        head.appendChild(script);
      }
    },
    callback: function(data) {
      if (data === undefined || data.body === undefined) {
        inProgress = false;
        if (queue.length > 0) {
          twitterFetcher.fetch(queue[0]);
          queue.splice(0, 1);
        }
        return;
      }
      if (!useEmoji) {
        data.body = data.body.replace(/(<img[^c]*class="Emoji[^>]*>)|(<img[^c]*class="u-block[^>]*>)/g, '');
      }
      if (!showImages) {
        data.body = data.body.replace(/(<img[^c]*class="NaturalImage-image[^>]*>|(<img[^c]*class="CroppedImage-image[^>]*>))/g, '');
      }
      if (!printUser) {
        data.body = data.body.replace(/(<img[^c]*class="Avatar"[^>]*>)/g, '');
      }
      var div = document.createElement('div');
      div.innerHTML = data.body;
      if (typeof(div.getElementsByClassName) === 'undefined') {
        supportsClassName = false;
      }

      function swapDataSrc(element) {
        var avatarImg = element.getElementsByTagName('img')[0];
        avatarImg.src = avatarImg.getAttribute('data-src-2x');
        return element;
      }
      var tweets = [];
      var authors = [];
      var times = [];
      var images = [];
      var rts = [];
      var tids = [];
      var permalinksURL = [];
      var x = 0;
      if (supportsClassName) {
        var tmp = div.getElementsByClassName('timeline-Tweet');
        while (x < tmp.length) {
          if (tmp[x].getElementsByClassName('timeline-Tweet-retweetCredit').length > 0) {
            rts.push(true);
          } else {
            rts.push(false);
          }
          if (!rts[x] || rts[x] && showRts) {
            tweets.push(tmp[x].getElementsByClassName('timeline-Tweet-text')[0]);
            tids.push(tmp[x].getAttribute('data-tweet-id'));
            if (printUser) {
              authors.push(swapDataSrc(tmp[x].getElementsByClassName('timeline-Tweet-author')[0]));
            }
            times.push(tmp[x].getElementsByClassName('dt-updated')[0]);
            permalinksURL.push(tmp[x].getElementsByClassName('timeline-Tweet-timestamp')[0]);
            if (tmp[x].getElementsByClassName('timeline-Tweet-media')[0] !== undefined) {
              images.push(tmp[x].getElementsByClassName('timeline-Tweet-media')[0]);
            } else {
              images.push(undefined);
            }
          }
          x++;
        }
      } else {
        var tmp = getElementsByClassName(div, 'timeline-Tweet');
        while (x < tmp.length) {
          if (getElementsByClassName(tmp[x], 'timeline-Tweet-retweetCredit').length > 0) {
            rts.push(true);
          } else {
            rts.push(false);
          }
          if (!rts[x] || rts[x] && showRts) {
            tweets.push(getElementsByClassName(tmp[x], 'timeline-Tweet-text')[0]);
            tids.push(tmp[x].getAttribute('data-tweet-id'));
            if (printUser) {
              authors.push(swapDataSrc(getElementsByClassName(tmp[x], 'timeline-Tweet-author')[0]));
            }
            times.push(getElementsByClassName(tmp[x], 'dt-updated')[0]);
            permalinksURL.push(getElementsByClassName(tmp[x], 'timeline-Tweet-timestamp')[0]);
            if (getElementsByClassName(tmp[x], 'timeline-Tweet-media')[0] !== undefined) {
              images.push(getElementsByClassName(tmp[x], 'timeline-Tweet-media')[0]);
            } else {
              images.push(undefined);
            }
          }
          x++;
        }
      }
      if (tweets.length > maxTweets) {
        tweets.splice(maxTweets, (tweets.length - maxTweets));
        authors.splice(maxTweets, (authors.length - maxTweets));
        times.splice(maxTweets, (times.length - maxTweets));
        rts.splice(maxTweets, (rts.length - maxTweets));
        images.splice(maxTweets, (images.length - maxTweets));
        permalinksURL.splice(maxTweets, (permalinksURL.length - maxTweets));
      }
      var arrayTweets = [];
      var x = tweets.length;
      var n = 0;
      if (dataOnly) {
        while (n < x) {
          arrayTweets.push({
            tweet: tweets[n].innerHTML,
            author: authors[n] ? authors[n].innerHTML : 'Unknown Author',
            author_data: {
              profile_url: authors[n] ? authors[n].querySelector('[data-scribe="element:user_link"]').href : null,
              profile_image: authors[n] ? authors[n].querySelector('[data-scribe="element:avatar"]').getAttribute('data-src-1x') : null,
              profile_image_2x: authors[n] ? authors[n].querySelector('[data-scribe="element:avatar"]').getAttribute('data-src-2x') : null,
              screen_name: authors[n] ? authors[n].querySelector('[data-scribe="element:screen_name"]').title : null,
              name: authors[n] ? authors[n].querySelector('[data-scribe="element:name"]').title : null
            },
            time: times[n].textContent,
            timestamp: times[n].getAttribute('datetime').replace('+0000', 'Z').replace(/([\+\-])(\d\d)(\d\d)/, '$1$2:$3'),
            image: extractImageUrl(images[n]),
            rt: rts[n],
            tid: tids[n],
            permalinkURL: (permalinksURL[n] === undefined) ? '' : permalinksURL[n].href
          });
          n++;
        }
      } else {
        while (n < x) {
          if (typeof(formatterFunction) !== 'string') {
            var datetimeText = times[n].getAttribute('datetime');
            var newDate = new Date(times[n].getAttribute('datetime').replace(/-/g, '/').replace('T', ' ').split('+')[0]);
            var dateString = formatterFunction(newDate, datetimeText);
            times[n].setAttribute('aria-label', dateString);
            if (tweets[n].textContent) {
              if (supportsClassName) {
                times[n].textContent = dateString;
              } else {
                var h = document.createElement('p');
                var t = document.createTextNode(dateString);
                h.appendChild(t);
                h.setAttribute('aria-label', dateString);
                times[n] = h;
              }
            } else {
              times[n].textContent = dateString;
            }
          }
          var op = '';
          if (parseLinks) {
            if (targetBlank) {
              targetLinksToNewWindow(tweets[n]);
              if (printUser) {
                targetLinksToNewWindow(authors[n]);
              }
            }
            if (printUser) {
              op += '<div class="user">' + strip(authors[n].innerHTML) + '</div>';
            }
            op += '<p class="tweet">' + strip(tweets[n].innerHTML) + '</p>';
            if (printTime) {
              if (permalinks) {
                op += '<p class="timePosted"><a href="' + permalinksURL[n] + '">' + times[n].getAttribute('aria-label') + '</a></p>';
              } else {
                op += '<p class="timePosted">' +
                  times[n].getAttribute('aria-label') + '</p>';
              }
            }
          } else {
            if (tweets[n].textContent) {
              if (printUser) {
                op += '<p class="user">' + authors[n].textContent + '</p>';
              }
              op += '<p class="tweet">' + tweets[n].textContent + '</p>';
              if (printTime) {
                op += '<p class="timePosted">' + times[n].textContent + ' ago</p>';
              }
            } else {
              if (printUser) {
                op += '<p class="user">' + authors[n].textContent + '</p>';
              }
              op += '<p class="tweet">' + tweets[n].textContent + '</p>';
              if (printTime) {
                op += '<p class="timePosted">' + times[n].textContent + ' ago</p>';
              }
            }
          }
          if (showInteractionLinks) {
            op += '<p class="interact"><a href="https://twitter.com/intent/' + 'tweet?in_reply_to=' + tids[n] + '" class="twitter_reply_icon"' +
              (targetBlank ? ' target="_blank">' : '>') + 'Reply</a><a href="https://twitter.com/intent/retweet?' + 'tweet_id=' + tids[n] + '" class="twitter_retweet_icon"' +
              (targetBlank ? ' target="_blank">' : '>') + 'Retweet</a>' + '<a href="https://twitter.com/intent/favorite?tweet_id=' +
              tids[n] + '" class="twitter_fav_icon"' +
              (targetBlank ? ' target="_blank">' : '>') + 'Favorite</a></p>';
          }
          if (showImages && images[n] !== undefined && extractImageUrl(images[n]) !== undefined) {
            op += '<div class="media">' + '<img src="' + extractImageUrl(images[n]) + '" alt="Image from tweet" />' + '</div>';
          }
          if (showImages) {
            arrayTweets.push(op);
          } else if (!showImages && tweets[n].textContent.length) {
            arrayTweets.push(op);
          }
          n++;
        }
      }
      handleTweets(arrayTweets);
      inProgress = false;
      if (queue.length > 0) {
        twitterFetcher.fetch(queue[0]);
        queue.splice(0, 1);
      }
    }
  };
  window.__twttrf = twitterFetcher;
  window.twitterFetcher = twitterFetcher;
  return twitterFetcher;
}));

/**
 * ### HOW TO CREATE A VALID ID TO USE: ###
 * Go to www.twitter.com and sign in as normal, go to your settings page.
 * Go to "Widgets" on the left hand side.
 * Create a new widget for what you need eg "user time line" or "search" etc.
 * Feel free to check "exclude replies" if you don't want replies in results.
 * Now go back to settings page, and then go back to widgets page and
 * you should see the widget you just created. Click edit.
 * Look at the URL in your web browser, you will see a long number like this:
 * 345735908357048478
 * Use this as your ID below instead!
 */

/**
 * How to use TwitterFetcher's fetch function:
 * 
 * @function fetch(object) Fetches the Twitter content according to
 *     the parameters specified in object.
 * 
 * @param object {Object} An object containing case sensitive key-value pairs
 *     of properties below.
 * 
 * You may specify at minimum the following two required properties:
 * 
 * @param object.id {string} The ID of the Twitter widget you wish
 *     to grab data from (see above for how to generate this number).
 * @param object.domId {string} The ID of the DOM element you want
 *     to write results to.
 *
 * You may also specify one or more of the following optional properties
 *     if you desire:
 *
 * @param object.maxTweets [int] The maximum number of tweets you want
 *     to return. Must be a number between 1 and 20. Default value is 20.
 * @param object.enableLinks [boolean] Set false if you don't want
 *     urls and hashtags to be hyperlinked.
 * @param object.showUser [boolean] Set false if you don't want user
 *     photo / name for tweet to show.
 * @param object.showTime [boolean] Set false if you don't want time of tweet
 *     to show.
 * @param object.dateFunction [function] A function you can specify
 *     to format date/time of tweet however you like. This function takes
 *     a JavaScript date as a parameter and returns a String representation
 *     of that date.
 * @param object.showRetweet [boolean] Set false if you don't want retweets
 *     to show.
 * @param object.customCallback [function] A function you can specify
 *     to call when data are ready. It also passes data to this function
 *     to manipulate them yourself before outputting. If you specify
 *     this parameter you must output data yourself!
 * @param object.showInteraction [boolean] Set false if you don't want links
 *     for reply, retweet and favourite to show.
 * @param object.showImages [boolean] Set true if you want images from tweet
 *     to show.
 * @param object.lang [string] The abbreviation of the language you want to use
 *     for Twitter phrases like "posted on" or "time ago". Default value
 *     is "en" (English).
 */

// ##### Advanced example 2 #####
// Similar as previous, except this time we pass a custom function to render the
// tweets ourself! Useful if you need to know exactly when data has returned or
// if you need full control over the output.


/*
This is the array of usernames from HNI_Botclub

*/
usersList = [];
var config1 = {};
var config2 = {};
var config3 = {};
var config4 = {};
var config5 = {};
var config6 = {};
var config7 = {};
var config8 = {};
var tweetFeedCount = 0;
var tweetFeedCount2 = 7;

/* Gets the Usernames from HNI_Botclub */
var config5HNI = {
  "profile": {
    "screenName": 'HNI_Botclub'
  },
  "domId": '',
  "maxTweets": 8,
  "dateFunction": '',
  "customCallback": handleTweets2,
};

function handleTweets2(tweets) {
  var x = tweets.length;
  var oneTwo = 0;
  var n = 0;
  var num = 5;

  var html = '';


  while (n < x) {

    html = tweets[n];

    var startUser = html.indexOf('.com/');
    var endUser = html.indexOf('/status');
    var userComp = html.substring(startUser + 5, endUser);

    usersList[7-n] = userComp;

    num++;

    n++;


  };
  /* Reruns the script with the usernames from the HNI function above to get each of their 1st tweets*/

  config1 = {
    "profile": {
      "screenName": usersList[0]
    },
    "domId": '',
    "maxTweets": 8,
    "dateFunction": '',
    "customCallback": handleTweets,
  };
  config2 = {
    "profile": {
      "screenName": usersList[1]
    },
    "domId": '',
    "maxTweets": 8,
    "dateFunction": '',
    "customCallback": handleTweets,
  };
  config3 = {
    "profile": {
      "screenName": usersList[2]
    },
    "domId": '',
    "maxTweets": 8,
    "dateFunction": '',
    "customCallback": handleTweets,
  };
  config4 = {
    "profile": {
      "screenName": usersList[3]
    },
    "domId": '',
    "maxTweets": 8,
    "dateFunction": '',
    "customCallback": handleTweets,
  };
  config5 = {
    "profile": {
      "screenName": usersList[4]
    },
    "domId": '',
    "maxTweets": 8,
    "dateFunction": '',
    "customCallback": handleTweets,
  };
  config6 = {
    "profile": {
      "screenName": usersList[5]
    },
    "domId": '',
    "maxTweets": 8,
    "dateFunction": '',
    "customCallback": handleTweets,
  };
  config7 = {
    "profile": {
      "screenName": usersList[6]
    },
    "domId": '',
    "maxTweets": 8,
    "dateFunction": '',
    "customCallback": handleTweets,
  };
  config8 = {
    "profile": {
      "screenName": usersList[7]
    },
    "domId": '',
    "maxTweets": 8,
    "dateFunction": '',
    "customCallback": handleTweets,
  };

  setTimeout(function() {
    twitterFetcher.fetch(config1);

  }, 5000);

  setTimeout(function() {
    twitterFetcher.fetch(config2);

  }, 10000);
  setTimeout(function() {
    twitterFetcher.fetch(config3);

  }, 15000);
  setTimeout(function() {
    twitterFetcher.fetch(config4);

  }, 20000);
  setTimeout(function() {
    twitterFetcher.fetch(config5);

  }, 25000);
  setTimeout(function() {
    twitterFetcher.fetch(config6);

  }, 30000);
  setTimeout(function() {
    twitterFetcher.fetch(config7);

  }, 35000);
  setTimeout(function() {
    twitterFetcher.fetch(config8);

  }, 40000);


}


/*
This is if tracking protection is enabled in for example Firefox. It populates the otherwise empty page with preset tweets.
*/


function ifTrackingProtect ()
{
/*

The list/array below can be edited to have new content. And if you want an image it should be in the div <div class="media"> 
*/

var preSetTweets = [
'<ul><li><p class="user"> Weird Convo Bot @WeirdConvoBot</p><p class="tweet">DAD: Are you a bae or a blessing? ME: Ugh goth DAD: butts honcho no tonto ME: skeleton I can&#8217;t sleep smh</p><p class="timePosted">50m ago</p><div class="media"></div></li></ul>', 
'<ul><li><p class="user">BloomSays @BloomSays </p><p class="tweet">-- Your hat is a little crushed, Mr Bloom said pointing. -- How half and half? says Bloom. Do you mean he...</p><p class="timePosted">2h ago</p><div class="media"></div></li></ul>',
'<ul><li><p class="user">This Is Just to Say @JustToSayBot </p><p class="tweet">I have eaten the complexions that were in the invitation Forgive me They were agglutinative so elfin and so hipped</p><p class="timePosted">2h ago</p><div class="media"></div></li></ul>',
'<ul><li><p class="user">blackobs @_blackobs  @everyarabicword </p><p class="tweet">Now observing a ravine in Prague, Czech Republic.</p><p class="timePosted">9h ago</p><div class="media"></div></li></ul>',
'<ul><li><p class="user">This Is Just to Say @JustToSayBot </p><p class="tweet">I have eaten the feedings that were in the transgression Forgive me They were Botswanan so moss-grown and so peach-colored</p><p class="timePosted">57m ago</p><div class="media"></div></li></ul>',
'<ul><li><p class="user">Pixel Sorter @pixelsorter </p><p class="tweet">: *burp* sorry, something went wrong... try again? different image?</p><p class="timePosted">6h ago</p><div class="media"></div></li></ul>',
'<ul><li><p class="user">BloomSays @BloomSays </p><p class="tweet">-- Who? says I. -- Now then, Mr Deasy said, rising. -- That on his empire, Stephen said, the sun never sets. -- Hockey!</p><p class="timePosted">7h ago</p><div class="media"></div></li></ul>',
'<ul><li><p class="user">This Is Just to Say @JustToSayBot </p><p class="tweet">I have eaten the caravans that were in the entertainment Forgive me They were clarified so organizational and so unharmed</p><p class="timePosted">8h ago</p><div class="media"></div></li></ul>',];

/*
Above can be edited then to have new content that can also be read from text file. But then there needs to be a script that reads the  text file and parses it into the var preSetTweets list from [0] to [7]
*/


if (document.getElementById('example1').innerHTML == '')
{
var counterTweet = 1
  document.getElementById('example1').innerHTML = preSetTweets[0]; 
setInterval(function() { 
   if (counterTweet <8)
   {
  document.getElementById('example1').innerHTML = preSetTweets[counterTweet]; 
  counterTweet = counterTweet+1;
    }
    else
    {
    counterTweet=0;
    }
    }, 5000);

  
}
	
};
setTimeout(ifTrackingProtect, 8000);
/*
This is the actual feed that gets created 
*/



function handleTweets(tweets) {
/*Also checks if there are multiple tweets from same account and then uses the n+1 tweet to put in feed*/
 
  var n = -1;
  var countn = -1;
   for (u = 0; u < 8; u++) {
	   if (usersList[tweetFeedCount] == usersList[u]) {
	   countn = countn+1; 
	   };
  };
  for (i = 0; i <= tweetFeedCount; i++) {
 
    if (usersList[tweetFeedCount] == usersList[i]) {


      n = n + 1;


    };
    
  };
  var element = document.getElementById('example1');
  
  var html = '<ul><li>' + tweets[countn-n] + '</li></ul>';
  element.innerHTML = html;
   tweetFeedCount = tweetFeedCount + 1;
  tweetFeedCount2 = tweetFeedCount2 - 1;

};
function timerReFirst ()
{   twitterFetcher.fetch(config5HNI);
};
setTimeout(timerReFirst, 2000);
/*infinite refresh */ 
function timerRe (){
  usersList = [];
 config1 = {};
 config2 = {};
 config3 = {};
 config4 = {};
 config5 = {};
 config6 = {};
 config7 = {};
 config8 = {};
 tweetFeedCount = 0;
 tweetFeedCount2 = 7;
    twitterFetcher.fetch(config5HNI);
};
setInterval(timerRe, 45000);