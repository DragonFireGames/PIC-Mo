location.path = location.pathname.split("/");
var _authCache = false;
var _authwaiting = [];
function getAuth() {
  return new Promise(async(resolve)=>{
    if (_authCache) return resolve(_authCache);
    _authwaiting.push(resolve);
    if (_authwaiting.length > 1) return;
    const res = await fetch("/api/auth/check");
    const data = await res.json();
    if (res.status > 206) throw Error(data);
    for (var i = 0; i < _authwaiting.length; i++) _authwaiting[i](data);
    _authCache = data;
    if (data.user) _userCache[data.user.id] = data.user;
  });
}

var _userCache = {};
async function getUser(id) {
  if (_userCache[id]) return _userCache[id];
  var res = await fetch("/api/auth/userdata?id="+id);
  var u = await res.json();
  _userCache[id] = u;
  return u;
}

function relativeDate(time) {
  var seconds = (Date.now() - time) / 1000;

  if (time == 0) return "never";

  var interval = Math.floor(seconds / (365.25 * 24 * 60 * 60));
  if (interval == 1) return "1 year ago";
  else if (interval > 1) return interval + " years ago";

  interval = Math.floor(seconds / (30.4375 * 24 * 60 * 60));
  if (interval == 1) return "1 month ago";
  else if (interval > 1) return interval + " months ago";

  interval = Math.floor(seconds / (7 * 24 * 60 * 60));
  if (interval == 1) return "1 week ago";
  else if (interval > 1) return interval + " weeks ago";

  interval = Math.floor(seconds / (24 * 60 * 60));
  if (interval == 1) return "1 day ago";
  else if (interval > 1) return interval + " days ago";

  interval = Math.floor(seconds / (60 * 60));
  if (interval == 1) return "1 hour ago";
  else if (interval > 1) return interval + " hours ago";

  interval = Math.floor(seconds / (60));
  if (interval == 1) return "1 minute ago";
  else if (interval > 1) return interval + " minutes ago";

  interval = Math.floor(seconds);
  if (interval == 1) return "1 second ago";
  return interval + " seconds ago";

  //return new Date(time).toUTCString();
}

function makeLiteralChars(string) {
  string = string.replace(/\&/g,"&amp;");
  string = string.replace(/</g,"&lt;");
  string = string.replace(/>/g,"&gt;");
  string = string.replace(/"/g,"&quot;");
  string = string.replace(/'/g,"&apos;");
  //string = string.replace(/ /g,"&nbsp;");
  return string;
}

function convertMarkdown(string) {
  string = makeLiteralChars(string);
  var escapable = "*_~`()[]\\!#@";
  for (var i = 0; i < escapable.length; i++) {
    string = string.replaceAll("\\"+escapable[i],"&#"+escapable.charCodeAt(i)+";"); // make certain characters escapable
  }
  string = string.replace(/\*\*([^*\n]+)\*\*/g,"<b>$1</b>"); // **bold**
  string = string.replace(/\*([^*\n]+)\*/g,"<i>$1</i>"); // *italics*
  string = string.replace(/__([^*\n]+)__/g,"<u>$1</u>"); // __underline__
  string = string.replace(/_([^*\n]+)_/g,"<i>$1</i>"); // _italics_
  string = string.replace(/~~([^*\n]+)~~/g,"<s>$1</s>"); // ~~strikethrough~~
  string = string.replace(/^-# ([^\n]+)$/gm,"<sub>$1</sub>"); // -# subtext
  string = string.replace(/^# ([^\n]+)$/gm,"<h1>$1</h1>"); // # header 1
  string = string.replace(/^## ([^\n]+)$/gm,"<h2>$1</h2>"); // # header 2
  string = string.replace(/^### ([^\n]+)$/gm,"<h3>$1</h3>"); // # header 3
  string = string.replace(/!\[([^\]"'>]*)\]\(((?:https?:\/\/|\/api\/media\/)[^\)"]+)\)/g,`<img src="$2" $1>`); // ![width=50 height=50](https://example.com/image)
  string = string.replace(/\[([^\]\n]+)\]\((https?:\/\/[^\)"\n]+)\)/g,`<a href="$2">$1</a>`); // [link](https://example.com)
  string = string.replace(/@([^\s]+)/g,`<a href="/user/$1">@$1</a>`); // @Username
  string = string.replace(/\n/g,"<br>"); // line breaks
  // still need to add: block quotes, lists, code, spoilers
  return string;
}

function previewContent(str,len) {
  return makeLiteralChars(str).replace(/\n[^]*$/,"").slice(0,len)+((str.includes("\n")||str.length>len)?"...":"");
}

function projHTML(list,tok) {
  return function (proj) {
    let div = `<a class="project-panel" href="/project/${proj.id}" ${proj.viewers.includes(tok?.user?.id)?`style="color: #b0b0b0;"`:""}>
      <div class="thumbnail-border"><img class="project-thumbnail" src="${proj.thumbnail || "/images/placeholders/PLACEHOLDER_project.png"}" alt=""></div>
      <div class="project-link">${previewContent(proj.title, 100)}</div>
      <div>By: <object><a href="/user/${proj.poster}"><i>${proj.poster}</i></a></object></div>
      <div>Score: ${proj.score} Views: ${proj.views}</div>
      <div class="project-tags">${tagHTML(proj.tags)}</div>
    </a>`;
    list.innerHTML += div;
    let lastThumbnail = list.children[list.children.length - 1].querySelector(".project-thumbnail");
    if (!lastThumbnail.getAttribute("src")) lastThumbnail.src = "/images/placeholders/PLACEHOLDER_project.png";
  };
}

function forumHTML(list,tok) {
  return function (post) {
    let div = `<a class="post-panel" href="/forum/discussion/${post.id}" ${post.viewers.includes(tok?.user?.id)?`style="color: #b0b0b0;"`:""}>
      <div class="post-top">
        <h2>${previewContent(post.title, 100)}</h2> 
        <p style="display: inline;">${previewContent(post.content,100)}
        <br>
      By: <object><a href="/user/${post.poster}"><i>${post.poster}</i></a></object> | Views: ${post.views} | Active ${relativeDate(post.activeAt)}</p>
      <div class="forum-tags">${tagHTML(post.tags)}</div>
      </div>
    </a>`;
    list.innerHTML += div;
  };
}

function userHTML(list) {
  return function (user) {
    let div = `<a class="user-panel" href="/user/${user.username}">
      <div class="comment-top">
      <img class="comment-avatar" src="${user.avatar || "/images/placeholders/PLACEHOLDER_project.png"}">
      <div class="comment-username">${user.username}</div>
      </div>
      ${previewContent(user.biography,100)}
      <div>Joined on ${new Date(user.joinedAt).toUTCString().replace(/\d\d:[^]+$/,"")} | ${user.role} </div>
    </a>`;
    list.innerHTML += div;
  };
}

function tagHTML(tags) {
  let container = ``;
  for(let tag of tags) {
    if(tag !== "") {  
     container += `<p>#${tag}</p>`;
    }
  }
  return container;
}
