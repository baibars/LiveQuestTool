/**
 * 演示程序当前的 “注册/登录” 等操作，是基于 “本地存储” 完成的
 * 当您要参考这个演示程序进行相关 app 的开发时，
 * 请注意将相关方法调整成 “基于服务端Service” 的实现。
 **/
(function($, owner)
{
	owner.SERVER = "http://116.228.6.173:1123/";
	owner.ANCHOR = 1;
	owner.ADMIN = 2;
	owner.NO_QUEST = 0;
	
	owner.createState = function(user)
	{
		var state = {
			account: user.account,
			token: user.token,
		};
		owner.setState(state);
	};
	
	owner.setState = function(state)
	{
		state = state || {};
		localStorage.setItem('$state', JSON.stringify(state));
	};

	owner.getState = function()
	{
		var stateText = localStorage.getItem('$state') || "{}";
		var state = JSON.parse(stateText);
		if (null != state.account)
		{
			var user = owner.getUser(state.account);
			if (null != user)
			{
				return user;
			}
		}
		return state;
	};
	
	owner.getAnchorState = function()
	{
		var state = owner.getState();
		if (owner.ANCHOR == state.type)
		{
			return state;
		}
		
		var users = JSON.parse(localStorage.getItem('$users') || '[]');
		for(var i = 0; i < users.length; ++i)
		{
		    if (owner.ANCHOR == users[i].type && state.group == users[i].group)
		    {
		    	return users[i];
		    }
		}	
		return null;
	};
	
	owner.getUser = function(account)
	{
		var users = JSON.parse(localStorage.getItem('$users') || '[]');
		for(var i = 0; i < users.length; ++i)
		{
		    if (account == users[i].account)
		    {
		    	return users[i];
		    }
		}
	};
	
	owner.setUser = function(user)
	{
		var users = JSON.parse(localStorage.getItem('$users') || '[]');
		for(var i = 0; i < users.length; ++i)
		{
		    if (user.account == users[i].account)
		    {
		    	users[i].token = (null != user.token) ? user.token : users[i].token;
		    	users[i].group = (null != user.group) ? user.group : users[i].group;
		    	users[i].type = (null != user.type) ? user.type : users[i].type;
		    	users[i].level = (null != user.level) ? user.level : users[i].level;
		    	users[i].exp = (null != user.exp) ? user.exp : users[i].exp;
		    	users[i].questID = (null != user.questID) ? user.questID : users[i].questID;
		    	localStorage.setItem('$users', JSON.stringify(users));
		    	return;
		    }
		}
		users.push(user);
		localStorage.setItem('$users', JSON.stringify(users));
	};
	
	owner.reg = function(regInfo, callback)
	{
		callback = callback || $.noop;
		regInfo = regInfo || {};
		regInfo.account = regInfo.account || '';
		regInfo.password = regInfo.password || '';
		if (regInfo.account.length < 1)
		{
			return callback('用户名最短需要 1 个字符');
		}
		if (regInfo.password.length < 1)
		{
			return callback('密码最短需要 1 个字符');
		}

		var data = "id=" + regInfo.account + "&password=" + regInfo.password;
		console.log("app.reg req data:" + data);
		mui.ajax(owner.SERVER + 'register', {
			data: data,
			dataType:'string',
			type:'get',
			timeout:10000,
			headers:{'Content-Type':'application/json'},	              
			success:function(rawData){
				console.log("app.reg ack success:" + rawData);
				var data = JSON.parse(rawData);
				if (0 == data.code)
				{
					return callback();
				}
				else
				{
					return callback("注册失败，code:" + data.code);
				}
			},
			error:function(xhr,type,errorThrown){
				console.log("app.reg ack error:" + type);
				return callback(type);
			}
		});
	};
	
	owner.login = function(loginInfo, callback)
	{
		callback = callback || $.noop;
		loginInfo = loginInfo || {};
		loginInfo.account = loginInfo.account || '';
		if (loginInfo.account.length < 1)
		{
			return callback('账号最短为 1 个字符');
		}
		if (null == loginInfo.password && null == loginInfo.token)
		{
			return callback('密码错误');
		}
		
		var data = "";
		if (null != loginInfo.password)
		{
			data = "id=" + loginInfo.account + "&password=" + loginInfo.password;
		}
		else
		{
			data = "id=" + loginInfo.account + "&token=" + loginInfo.token;
		}
		console.log("app.login req data:" + data);
		mui.ajax(owner.SERVER + 'login', {
			data: data,
			dataType:'string',
			type:'get',
			timeout:10000,
			headers:{'Content-Type':'application/json'},	              
			success:function(rawData){
				console.log("app.login ack success:" + rawData);
				var data = JSON.parse(rawData);
				if (0 == data.code)
				{
					var users = [];
					for (var i = 0; i < data.charList.length; ++i)
					{
						users.push(data.charList[i]);
					}
					localStorage.setItem('$users', JSON.stringify(users));		
					owner.createState(data.charList[0]);
					return callback();
				}
				else
				{
					return callback("登录失败，code:" + data.code);
				}
			},
			error:function(xhr,type,errorThrown){
				console.log("app.login ack error:" + type);
				return callback(type);
			}
		});
	};
	
	owner.takeQuest = function(callback)
	{
		var state = owner.getState();
		if (owner.ANCHOR != state.type || owner.NO_QUEST != state.questID)
		{
			return callback("状态错误");
		}
		
		var data = "id=" + state.account + "&token=" + state.token;
		console.log("app.takeQuest req data:" + data);
		mui.ajax(owner.SERVER + 'takeQuest', {
			data: data,
			dataType:'string',
			type:'get',
			timeout:10000,
			headers:{'Content-Type':'application/json'},	              
			success:function(rawData){
				console.log("app.takeQuest ack success:" + rawData);
				var data = JSON.parse(rawData);
				if (0 == data.code)
				{
					data.account = state.account;
					owner.setUser(data);
			    	return callback();
				}
				else
				{
					return callback("领取任务失败，code:" + data.code);
				}
			},
			error:function(xhr,type,errorThrown){
				console.log("app.takeQuest ack error:" + type);
				return callback(type);
			}
		});
	};
	
	owner.finishQuest = function(callback)
	{
		var state = owner.getState();
		if (owner.ADMIN != state.type)
		{
			return callback("状态错误");
		}
		
		var anchor = owner.getAnchorState()
		if (null == anchor)
		{
			return callback("状态错误");
		}
		
		var data = "myid=" + state.account + "&token=" + state.token + "&targetid=" + anchor.account;
		console.log("app.fihishQuest req data:" + data);
		mui.ajax(owner.SERVER + 'finishQuest', {
			data: data,
			dataType:'string',
			type:'get',
			timeout:10000,
			headers:{'Content-Type':'application/json'},	              
			success:function(rawData){
				console.log("app.fihishQuest ack success:" + rawData);
				var data = JSON.parse(rawData);
				if (0 == data.code)
				{
					data.account = anchor.account;
					data.questID = owner.NO_QUEST;
					owner.setUser(data);
					return callback();
				}
				else
				{
					return callback("完成任务失败，code:" + data.code);
				}
			},
			error:function(xhr,type,errorThrown){
				console.log("app.fihishQuest ack error:" + type);
				return callback(type);
			}
		});
	};
	
	owner.refresh = function(callback)
	{
		var data = "";
		var state = owner.getState();
		if (null == state || null == state.account)
		{
			return;
		}
		
		var account = state.account;
		if (owner.ADMIN == state.type)
		{
			var anchor = owner.getAnchorState()
			if (null == anchor)
			{
				return callback("状态错误");
			}
			account = anchor.account;
		}
		data = "id=" + state.account + "&token=" + state.token + "&queryid=" + account;
		
		mui.ajax(owner.SERVER + 'refresh', {
			data: data,
			dataType:'string',
			type:'get',
			timeout:10000,
			headers:{'Content-Type':'application/json'},	              
			success:function(rawData){
				console.log("app.refresh ack success:" + rawData);
				var data = JSON.parse(rawData);
				if (0 == data.code)
				{
					data.account = account;
					owner.setUser(data);
					return callback();
				}
				else
				{
					return callback("刷新失败，code:" + data.code);
				}
			},
			error:function(xhr,type,errorThrown){
				console.log("app.refresh ack error:" + type);
				callback(type);
			}
		});
	};
	
	owner.getQuestInfo = function(id)
	{
		var quests = JSON.parse(localStorage.getItem('$quests') || '[]');
		for(var i = 0; i < quests.length; ++i)
		{
		    if (id == quests[i].id)
		    {
		    	return quests[i];
		    }
		}
	};
	
	owner.getPreExp = function(level)
	{
		var exps = JSON.parse(localStorage.getItem('$exps') || '[]');
		return exps[level - 1];
	}
	
	owner.getMaxExp = function(level)
	{
		var exps = JSON.parse(localStorage.getItem('$exps') || '[]');
		return exps[level];
	}
	
	owner.getLevelData = function(callback)
	{
		mui.ajax(owner.SERVER + 'getExp', {
			data: "",
			dataType:'string',
			type:'get',
			timeout:10000,
			headers:{'Content-Type':'application/json'},	              
			success:function(rawData){
//				console.log("app.getLevelData ack success:" + rawData);
				var data = JSON.parse(rawData);
				if (0 == data.code)
				{
					var exps = [ 0, ];
					for (i = 0; i < data.expList.length; ++i)
					{
						exps[data.expList[i].id] = data.expList[i].nextExp;
					}
					if (exps.length != data.expList.length + 1)
					{
						console.log("app.getLevelData error! exps.length:" + exps.length + " data.expList.length:" + data.expList.length);
						return callback("level数据错误");
					}
					for (i = 0; i < exps.length; ++i)
					{
						if (null == exps[i])
						{
							console.log("app.getLevelData error! level " + i + " have no data");
							return callback("level数据错误");
						}
					}					
					localStorage.setItem('$exps', JSON.stringify(exps));
					return callback();
				}
				else
				{
					return callback("level数据错误，code:" + data.code);
				}
			},
			error:function(xhr,type,errorThrown){
				console.log("app.getLevelData ack error:" + type);
				return callback(type);
			}
		});	
	};
	
	owner.getQuestData = function(callback)
	{
		mui.ajax(owner.SERVER + 'getQuest', {
			data: "",
			dataType:'string',
			type:'get',
			timeout:10000,
			headers:{'Content-Type':'application/json'},	              
			success:function(rawData){
//				console.log("app.getQuestData ack success:" + rawData);
				var data = JSON.parse(rawData);
				if (0 == data.code)
				{
					var quests = [];
					for (i = 0; i < data.questList.length; ++i)
					{
						quests.push({
							id: data.questList[i].id,
							title: data.questList[i].name,
							desc: data.questList[i].desc,
							bonus: data.questList[i].award,
							exp: data.questList[i].awardExp,
						})
					}
					localStorage.setItem('$quests', JSON.stringify(quests));
					return callback();
				}
				else
				{
					return callback("quest数据错误，code:" + data.code);
				}
			},
			error:function(xhr,type,errorThrown){
				console.log("app.getQuestData ack error:" + type);
				callback(type);
			}
		});
	};

	var checkEmail = function(email) {
		email = email || '';
		return (email.length > 3 && email.indexOf('@') > -1);
	};

	/**
	 * 找回密码
	 **/
	owner.forgetPassword = function(email, callback) {
		callback = callback || $.noop;
		if (!checkEmail(email)) {
			return callback('邮箱地址不合法');
		}
		return callback(null, '新的随机密码已经发送到您的邮箱，请查收邮件。');
	};

	/**
	 * 获取应用本地配置
	 **/
	owner.setSettings = function(settings) {
		settings = settings || {};
		localStorage.setItem('$settings', JSON.stringify(settings));
	}

	/**
	 * 设置应用本地配置
	 **/
	owner.getSettings = function() {
			var settingsText = localStorage.getItem('$settings') || "{}";
			return JSON.parse(settingsText);
		}
		/**
		 * 获取本地是否安装客户端
		 **/
	owner.isInstalled = function(id) {
		if (id === 'qihoo' && mui.os.plus) {
			return true;
		}
		if (mui.os.android) {
			var main = plus.android.runtimeMainActivity();
			var packageManager = main.getPackageManager();
			var PackageManager = plus.android.importClass(packageManager)
			var packageName = {
				"qq": "com.tencent.mobileqq",
				"weixin": "com.tencent.mm",
				"sinaweibo": "com.sina.weibo"
			}
			try {
				return packageManager.getPackageInfo(packageName[id], PackageManager.GET_ACTIVITIES);
			} catch (e) {}
		} else {
			switch (id) {
				case "qq":
					var TencentOAuth = plus.ios.import("TencentOAuth");
					return TencentOAuth.iphoneQQInstalled();
				case "weixin":
					var WXApi = plus.ios.import("WXApi");
					return WXApi.isWXAppInstalled()
				case "sinaweibo":
					var SinaAPI = plus.ios.import("WeiboSDK");
					return SinaAPI.isWeiboAppInstalled()
				default:
					break;
			}
		}
	}
}(mui, window.app = {}));