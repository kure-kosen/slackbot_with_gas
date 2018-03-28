var access_token = PropertiesService.getScriptProperties().getProperty('SLACK_ACCESS_TOKEN');

/////////////////////////////////////////////////////////////////////////////////////////////////

function main() {
  var justNow = new Date().getTime()/1000;
  var aweekago = justNow - 7*24*60*60;
  var broadcast_channel = PropertiesService.getScriptProperties().getProperty('BROADCAST_CHANNEL');
  
  var channels = channelsId();
  var msgsCount = {};
  for (var i=0; i<channels.length; i++) {
    var msgs = channelMsgs(channels[i], aweekago);
    
    for (var j=0; j<msgs.length; j++){
      if (!isSimpleMsg(msgs[j])) continue;
      
      if(msgs[j]['user'] in msgsCount){
        msgsCount[msgs[j]['user']]++;
      }else{
        msgsCount[msgs[j]['user']] = 1;
      }
    }
  }
  
  
  
  if(Object.keys(msgsCount).length==0) {
    postMessage(broadcast_channel, '直近一週間は誰も喋ってませんなし。寂しいワークスペースなっしー');
    return;
  }
  
  
  var rankingUser = sortRanking(msgsCount, 5);
  
  var postMsg = '直近一週間の全チャンネル合計発言数ランキングを発表するなっしー\n';
  postMsg += '今回の上位５名はこちら！\n';
  
  for (var i=0; i<rankingUser.length; i++) {
    postMsg += '<@' + rankingUser[i] + '>  ' + msgsCount[rankingUser[i]] + '回\n';
  }
  
  postMsg += '今週も頑張るなっしー';
  postMessage(broadcast_channel, postMsg);
}

////////////////////////////////////////////////////////////////////////////////////////////////////

function isSimpleMsg(msg) {
  // not user
  if(msg['user']==undefined) return false;
  // not message
  if(msg['type']!='message') return false;
  // event
  if('subtype' in msg) return false;
  
  return true;
}



function toObj(res) {
  return JSON.parse(res.getContentText());
}



function sortRanking(msgsCount, rankingNum) {
  var rankingUsers = [];
  var users = Object.keys(msgsCount);
  var topUserIndex = 0;
  
  for (var ranking = 1; ranking <= rankingNum; ranking++) {
    for (var i=0; i<users.length; i++) {
      if (msgsCount[users[i]] > msgsCount[users[topUserIndex]]) {
        topUserIndex = i;
      }
    }
    if (users.length != 0) {
    
      rankingUsers.push(users[topUserIndex]);
      users.splice(topUserIndex, 1);
    }
  }
  return rankingUsers;
}



function channelsId() {
  var res = UrlFetchApp.fetch('https://slack.com/api/channels.list?token=' + access_token + '&exclude_archived=true&exclude_members=true');
  var channelsList = toObj(res)['channels'];
  var channels = [];
  for(var i=0; i<channelsList.length; i++) {
    channels.push(channelsList[i]['id']);
  }
  return channels;
}



function channelMsgs(channel, range) {
  var res = UrlFetchApp.fetch('https://slack.com/api/channels.history?token=' + access_token + '&channel=' + channel + '&count=1000'+ '&oldest='+ range );
  var history = toObj(res);
  return history['messages'];
}



function postMessage(channel, message){
  var headers = {
    "Authorization": 'Bearer ' + access_token,
    "Content-type": "application/json; charset=UTF-8"
  }
  var payload = {
    "channel": channel,
    "text": message,
    "as_user": false,
    'icon_url': 'https://emoji.slack-edge.com/T84UUNQBY/funassyi_static/bb7f2c3ab38adb00.png',
    'username': 'ランキング教えるなっしー',
  }
  var options = {
    "method": "post",
    "headers": headers,
    "payload": JSON.stringify(payload)
  }
  UrlFetchApp.fetch('https://slack.com/api/chat.postMessage', options);
}
