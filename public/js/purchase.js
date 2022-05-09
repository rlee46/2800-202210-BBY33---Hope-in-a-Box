'use strict';

function ajaxGET(url, callback, data) {
    let params = typeof data == 'string' ? data : Object.keys(data).map(
        function (k) {
            return encodeURIComponent(k) + '=' + encodeURIComponent(data[k])
        }
    ).join('&');
    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
        if (this.readyState == XMLHttpRequest.DONE && this.status == 200) {
            callback(this.responseText);
        } else {
            console.log(this.status);
        }
    }
    xhr.open("POST", url);
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.send(params);
}

function getPackage() {
    var countryId;
    var countryName;
    var queryString;
    const onClick = (event) => {
        console.log(event.target.id);
        countryId = event.target.id;
        console.log(countryId);
        countryName = "Ukraine";
        queryString = "countryID=" + countryId + "&countryName=" + countryName;
        console.log(queryString);
        ajaxGET("/get-packages", function (data) {

            if (data) {
                let dataParsed = JSON.parse(data);
                if (dataParsed.status == "fail") {
                    console.log("fail");
                } else {
                    console.log("This is data" + data);
                    console.log("This is data" + dataParsed.rows.length);
                    let str = ""
                    for (let i = 0; i < dataParsed.rows.length; i++) {
                        let row = dataParsed.rows[i];
                        str += (`<div class='card'> 
                            <div id='title'>${row.package_name} 
                            </div><div id='pImage'><img width='100' height='100' src="${row.package_image}">
                            </div><div id='price'> $${row.package_price} 
                            </div><div id='description'>${row.description_of_package}
                            </div><input type='submit' value='submit' id='${row.package_id}'></div><br>`);
                    }
                    document.getElementById("pList").innerHTML = str
                }
            }
        }, queryString);
    };
    let records = document.querySelectorAll(".countries");
    for (let j = 0; j < records.length; j++) {
        records[j].addEventListener("click", onClick);
    }

};

getPackage();