var mongoData = []
var excelData = []
var dTable
updates = 0
inserts = 0;
synchros = 0;

function reLoad()
{
location.reload();
//main
}


function handleFile(e) {
    var rABS = true
    var files = e.files;
    var i, f;
    for (i = 0; i != files.length; ++i) {
        f = files[i];
        var reader = new FileReader();
        var name = f.name;
        reader.onload = function (e) {
            var data = e.target.result;

            var workbook;
            if (rABS) {
                workbook = XLSX.read(data, { type: 'binary' });
            } else {
            }

            excelData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]])
            compareData();
            $("#synchro").show();
            $("#excelload").hide();

        };
        reader.readAsBinaryString(f);

    }
}


function compareData() {
    found = false;
    len = mongoData.length;
    for (var index = 0; index < excelData.length; index++) {
        for (var index1 = 0; index1 < len; index1++) {

            if (mongoData[index1].cuid === excelData[index].CUID) {
                mongoData[index1].eeFromBPM = excelData[index].eeFromBPM
                mongoData[index1].eeCorrection = excelData[index].eeCorrection
                mongoData[index1].ee2Invoice = excelData[index].ee2Invoice
                mongoData[index1].Synchro = "!to change"
                updates++;
                found = true
                break
            }
        }

        if (found === false) {
            mongoData.push({
                cuid: excelData[index].CUID,
                cid: excelData[index].CID,
                client: excelData[index].Client,
                country: excelData[index].Country,
                eeFromBPM: excelData[index].eeFromBPM,
                eeCorrection: excelData[index].eeCorrection,
                ee2Invoice: excelData[index].ee2Invoice,
                Synchro: "!to add"

            })
            inserts++;
        }

        found = false
    }


    $("#updates").text(updates);
    $("#inserts").text(inserts);


    dTable.clear().rows.add(mongoData).draw()
}


function getData() {
    $.ajax({
        url: "http://localhost:8080/ServiceMetrics-1.0-SNAPSHOT/webresources/payslips",
        type: 'GET',
        success: function (result) {
            mongoData = result;
            mongoData.forEach(function (obj) { obj.Synchro = "pristine"; });

            dTable = $('#myTable').DataTable({
                data: mongoData,
                columns: [
                    { title: "CUID", data: 'cuid' },
                    { title: "CID", data: 'cid' },
                    { title: "Country", data: 'country' },
                    { title: "Client", data: 'client' },
                    { title: "BPM", data: 'eeFromBPM' },
                    { title: "Correction", data: 'eeCorrection' },
                    { title: "Invoice", data: 'ee2Invoice' },
                    { title: "Synchro", data: 'Synchro' }
                ],
                fnRowCallback: function (nRow, aData, iDisplayIndex, iDisplayIndexFull) {
                    if ($(nRow).find('td:eq(7)').text().substring(0,1) == '!')
                    {
                        $(nRow).find('td:eq(7)').css({'color':'red'});
                    }}
                });

        }
    })
};

function SynchroData() {
    for (var x = 0; x < mongoData.length; x++) {

        switch (mongoData[x].Synchro) {
            case "!to add":
                var data = JSON.stringify
                    ({
                        "eeFromBPM": mongoData[x].eeFromBPM,
                        "eeCorrection": mongoData[x].eeCorrection,
                        "ee2Invoice": mongoData[x].ee2Invoice,
                        "country": mongoData[x].country,
                        "cuid": mongoData[x].cuid,
                        "cid": mongoData[x].cid,
                        "client": mongoData[x].client
                    });
                putData(data, 'PUT')
                break;

            case "!to change":
                var data = JSON.stringify
                    ({
                        "pk": mongoData[x].pk,
                        "eeFromBPM": mongoData[x].eeFromBPM,
                        "eeCorrection": mongoData[x].eeCorrection,
                        "ee2Invoice": mongoData[x].ee2Invoice,
                        "country": mongoData[x].country,
                        "cuid": mongoData[x].cuid,
                        "cid": mongoData[x].cid,
                        "client": mongoData[x].client
                    });

                putData(data, 'POST')
                break;
        }
    }

}

function putData(adata, atype) {
    $.ajax({
        type: atype,
        url: "http://localhost:8080/ServiceMetrics-1.0-SNAPSHOT/webresources/payslips",
        headers: { 'Content-Type': 'application/json' },
        data: adata,
        async: false,
        error:function(XHR, textStatus, errorThrown){
        //$("#log").append("<b>"+errorThrown+"</b><span>"+adata+"</span>")
        },
        complete: function (XHR,status) {
            //$("#log").append("<b>"+status+"</b><span>"+adata+"</span>")
            synchros++;
            $("#synchros").text(synchros);
            if (synchros >= inserts + updates) {
            alert("Done")
          //  reLoad();

            }
        }
    })

};

