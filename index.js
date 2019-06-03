(function () {
    // Electron variables
    const fs = require('fs'),
        path = require('path'),
        dialog = require('electron').remote.dialog;

    let pdftext = require('pdf-textstring'),
        AbsolutePathToApp = path.dirname(process.mainModule.filename),
        pathToPdftotext = AbsolutePathToApp + "/bin/pdftotext.exe",
        pathToPdffonts = AbsolutePathToApp + "/bin/pdffonts.exe";
    pdftext.setBinaryPath_PdfToText(pathToPdftotext);
    pdftext.setBinaryPath_PdfFont(pathToPdffonts);

    //DOM variables
    const btnOpen = document.getElementById('btnOpen'),
        btnGenerateCsv = document.getElementById('generateCsv'),
        btnRenamePdfs = document.getElementById('renamePdf'),
        fileOutput = document.getElementById('fileContents'),
        regularExpIsin = /([A-Z]{2})([A-Z0-9]{9})([0-9]{1})/;

    let fileList = '',
        filePath = [],
        pdfFilesText = [],
        pdfFiles = [];


    function generateCsvFile() {
        fs.writeFile(`${filePath}\\list.csv`, fileList, (err) => {
            if (err) {
                alert("An error ocurred updating the file" + err.message);
                console.log(err);
                return;
            }
            alert(`The file has been succesfully saved: ${filePath}`);
        });
    }
    function renamePdf() {
        fileList = '';
        fileOutput.value = '';

        pdfFiles.forEach((file) => { //for every file.pdf
            let pdfsPaths = path.join(filePath, file); //concat path with file.pdf

            pdftext.pdftotext(pdfsPaths, function (err, data) { // get text from pdf
                if (err) {
                    return alert(err);
                } else {
                    const isinCode = data.match(regularExpIsin)[0]; //find ISIN code inside the pdf file

                    const pdfText = {
                        path: pdfsPaths,
                        isin: isinCode
                    }
                    pdfFilesText.push(pdfText);
                    let newPath = path.join(filePath, `${isinCode}.pdf`);
                    fs.renameSync(pdfsPaths, newPath);
                    fileList += `${isinCode}.pdf\n`;
                }
                fileOutput.value = fileList;
            })
        });
    }
    function getFolderContent() {
        // passing directoryPath and callback function
        fs.readdir(filePath, function (err, files) { //files: files in the folder
            //handling error
            if (err) {
                return alert('Unable to scan directory: ' + err);
            }
            //listing all files
            pdfFiles = [...files];
            fileList = files.join('\n');
            fileOutput.value = fileList;
            btnGenerateCsv.classList.add('btn-default');
            btnRenamePdfs.classList.add('btn-default');
            btnGenerateCsv.disabled = false;
            btnRenamePdfs.disabled = false;
        })
    }

    function selectDirectory() {

        dialog.showOpenDialog({
            properties: ['openDirectory'],
            filters: [{ name: 'PDF', extensions: ['pdf'] }]

        }, (folderPath) => {
            if (folderPath === undefined) {
                return console.log("The path has not been chosen.");
            };
            filePath = folderPath[0];
            console.log(filePath);
            getFolderContent();
        });
    }
    btnOpen.addEventListener('click', selectDirectory);
    btnGenerateCsv.addEventListener('click', generateCsvFile);
    btnRenamePdfs.addEventListener('click', renamePdf);
}())
