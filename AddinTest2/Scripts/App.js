'use strict';

var siteURL;
var listURL;
var userId;
var clientContext;
var listText;
var count;
var teamNames = [];
var teamParent = [];
var teamChild = [];
var teamManager = [];
var teamMembers = [];
var teamSPID = [];

SP.SOD.executeFunc('sp.js', 'SP.ClientContext', sharePointReady);

function deleteTeam(_refID) {
    if (teamChild[_refID] != null) {
        alert("下位組織があるため削除できません");
    } else {
        var answer = confirm("本当に削除しますか？");
        if (answer) {
            // parentのchildから削除する処理がここに必要
            deleteItem("m_team_entities", teamSPID[_refID]);
            
        }
    }

}

function deleteItem(_listName, _ID) {
    return $.ajax({
        url: listURL + "GetByTitle('" + _listName + "')/getItemById('" + _ID + "')",
        type: "DELETE",
        headers: {
            "accept": "application/json;odata=verbose",
            "X-RequestDigest": $("#__REQUESTDIGEST").val(),
            "If-Match": "*"
      
        },
        success: function () {
        
        },
        error: function (error) {
            alert(error);
        }
    });
}


function linkButtonSyntax(_refID) {
    //var syntaxStr = "<a href=\"#\" title=\"Header\" data-toggle=\"popover\" data-placement=\"right\" data-content=\"Content\">Right</a>";
    var parentStr = teamNames[parseInt(teamParent[_refID], 10)];
    if (!parentStr) { parentStr = "";}
    var childStr = "";
    if (teamChild[_refID] != null) {
        var childStrArr = teamChild[_refID].split("|");
        for (var i = 0; i < childStrArr.length; i++) {
            childStr += teamNames[parseInt(childStrArr[i],10)] + ", ";
        }
        childStr = childStr.slice(0,-2);
    }
    var syntaxStr = "<a href='#' title='" + teamNames[_refID] + "' data-trigger='focus' data-toggle='popover' data-placement='right' ";
    syntaxStr += "data-content=\"<img src='../Images/up.png' /><br>" + parentStr + "<br><br><img src='../Images/down.png' /><br>" + childStr + "<br><br><img src='../Images/announcement.png' /><br>" + teamManager[_refID] + "<br><br><img src='../Images/contact.png' /><br>" + teamMembers[_refID] + "<br><br><button type='button' class='btn btn-success btn-xs'>新規</button> <button type='button' class='btn btn-success btn-xs'>編集</button> <button type='button' class='btn btn-danger btn-xs' onclick='deleteTeam(" + _refID + ");'>削除</button>\">";
    syntaxStr += "<font color=white><b>" + teamNames[_refID] + "</b></font></a>";
    return syntaxStr;
}

function getListData(_listName, _queryString) {
    return $.ajax({ 
        url: listURL + "/GetByTitle('" + _listName + "')/items?" + _queryString,
        type: "GET",
        headers: {
            "accept": "application/json;odata=verbose"
        },
    });
}

function getUserData(_userID) {
    return $.ajax({ 
        url: siteURL + "/_api/web/getuserbyid(" + _userID + ")",
        type: "GET",
        headers: {
            "accept": "application/json;odata=verbose"
        },
    });
}


function constructList() {
    var deferred = new $.Deferred();
    var teamArray = [];
    var parentID;
    getListData("m_team_entities",
        "$select=ID,team_level,team_name,parent_team,child_teams,team_ID,team_manager/Title,team_members/Title&$expand=team_manager/Title,team_members/Title&$orderby=team_level desc").done(function (data) {
  //      "$select=team_level,team_name,parent_team,team_ID&$orderby=team_level desc").done(function (data) {
            $.each(data.d.results, function (key, value) {
                var teamIDInt = parseInt(value.team_ID, 10);
                var parentIDInt = parseInt(value.parent_team, 10);
                teamSPID[teamIDInt] = value.ID;
                teamNames[teamIDInt]=value.team_name;
                teamParent[teamIDInt]=value.parent_team;
                teamChild[teamIDInt]=value.child_teams;
                teamManager[teamIDInt] = value.team_manager.Title;
                teamMembers[teamIDInt] = "";
                if (value.team_members.results.length >0) {
                    for (var i = 0; i < value.team_members.results.length; i++) {
                        teamMembers[teamIDInt] += value.team_members.results[i].Title + ", ";
                    }
                    teamMembers[teamIDInt] = teamMembers[teamIDInt].slice(0, -2);
                }
            if (value.team_level == 0) {
                teamArray[teamIDInt] = "<ul id='tree-data' style='display:none'><li id='0'>0<ul>" + teamArray[teamIDInt] + "</ul></li></ul>";
            } else {


                if (teamArray[teamIDInt]) {
                    teamArray[teamIDInt] = "<li id='" + teamIDInt + "'>" + teamIDInt + "<ul>" + teamArray[teamIDInt] + "</ul></li>";
                } else {
                    teamArray[teamIDInt] = "<li id='" + teamIDInt + "'>" + teamIDInt + "</li>";
                }
                if (teamArray[parentIDInt]) {
                    teamArray[parentIDInt] += teamArray[teamIDInt];
                } else {
                    teamArray[parentIDInt] = teamArray[teamIDInt];
                }
            }
        });        
        listText = teamArray[0];
    }).always(function () {
        console.log("ajax finish");
        deferred.resolve();
    });
    return deferred;
}

function viewTeam(_teamID) {
    var managerID;
    getListData("m_team_entities", "$select=team_manager/Title,team_members/Title,parent_team,child_teams,team_level&$expand=team_manager/Title,team_members/Title&$filter=team_ID eq " + _teamID).success(function (data) {
        $.each(data.d.results, function (key, value) {
//    console.log(value);
            alert("組織名 : " + teamNames[_teamID]);
            alert("責任者 : " + value.team_manager.Title);
            if (value.parent_team != null) {
                alert("上位組織 : " + teamNames[value.parent_team]);
            } else { alert("上位組織無し"); }
            if (value.child_teams != null) {
                var childArray = value.child_teams.split("|");
                childArray = childArray.map(function rep(item) { return teamNames[item] });
                alert("下位組織 : " + childArray.join(", "));
            } else { alert("下位組織無し"); }
            alert("メンバー : "+value.team_members.results.Title)         
            
           
        });
    });
}

//function viewTeam(_teamID) {
//    var managerID;
//    getListData("m_team_entities", "$select=team_managerId,parent_team,team_ID&$filter=team_ID eq " + _teamID).success(function (data) {
//        $.each(data.d.results, function (key, value) {
//            alert("parant_team"+value.parent_team);
//            alert("teamID"+value.team_ID);
//            alert("parent team : " + teamNames[value.parent_team]);
//            alert("team name : " + teamNames[value.team_ID]);
//            managerID = value.team_managerId;
//            alert("managerID" + managerID);
//            alert(managerID);
//            getUserData(managerID).success(function (data) {
//                console.log(data);
//                alert(data.d.Title);
//                $.each(data.d.results, function (key, value) {
//                    alert(value.Title);
//                });
//            });
//        });
//    });
    
//}


function sharePointReady() {
    
    siteURL = _spPageContextInfo.webAbsoluteUrl;
    listURL = siteURL + "/_api/web/lists/";
    userId = _spPageContextInfo.userId;

    
    listText = "";
    var deferred = constructList();
    deferred.done(function () {
        $("#listText").html(listText);
        $("#tree-data").jOrgChart({
          chartElement: $("#tree-view")
        });
        $('[data-toggle="popover"]').popover({ html: true });

    });
    
}