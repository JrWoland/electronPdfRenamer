(function () {
   // Electron variables
   const fs = require('fs'),
      path = require('path'),
      dialog = require('electron').remote.dialog,
      LanguageDetect = require('languagedetect');

   let pdftext = require('pdf-textstring'),
      AbsolutePathToApp = path.dirname(process.mainModule.filename),
      pathToPdftotext = AbsolutePathToApp + '/bin/pdftotext.exe',
      pathToPdffonts = AbsolutePathToApp + '/bin/pdffonts.exe';
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
      let textToCsv = '';
      const parseCsv = () => {
         const concatText = [];
         pdfFilesText.forEach((pdfObj) => {
            let concatRow = '';
            for (const key in pdfObj) {
               concatRow += `${pdfObj[key]},`;
            }
            concatText.push(concatRow);
         })
         textToCsv = concatText.join('\n');
      }
      parseCsv();

      fs.writeFile(`${filePath}\\#template.csv`, textToCsv, (err) => {
         if (err) {
            alert('An error ocurred updating the file' + err.message);
            console.log(err);
            return;
         }
         alert(`The file has been succesfully saved: ${filePath}`);
      });
   }

   function detectLanguage(text) {
      const lngDetector = new LanguageDetect();

      const middleOfString = Math.round(text.length / 2);
      const sampleOfString = text.substr(middleOfString, 1000)
      language = lngDetector.detect(sampleOfString, 1);
      return language[0][0];
   }

   function renamePdf() {
      fileOutput.value = '';
      const checkBoxIsin = document.getElementById('isin').checked;
      const checkBoxLanguage = document.getElementById('language').checked;
      if (!(checkBoxIsin || checkBoxLanguage)) {
         return alert('Please select any data to fetch.');
      }

      pdfFiles.forEach((file) => { //for every file.pdf
         let pdfsPaths = path.join(filePath, file); //concat path with file.pdf

         pdftext.pdftotext(pdfsPaths, (err, data) => { // get text from pdf
            if (err) {
               return alert(err);
            } else {
               const pdfInfos = new PdfFilesInfo();

               if (checkBoxIsin) {
                  pdfInfos.isin = data.match(regularExpIsin)[0]; //find ISIN code inside the pdf file
               }
               if (checkBoxLanguage) {
                  pdfInfos.language = detectLanguage(data); //get language of pdf file
               }

               let newFileName = `${file.replace('.pdf', ' ')}${pdfInfos.language}_${pdfInfos.isin}.pdf`; //add language and isin code to existing file name
               let newPath = path.join(filePath, newFileName);
               fs.renameSync(pdfsPaths, newPath);

               pdfInfos.path = newPath;
               pdfInfos.fileName = newFileName;
               fileOutput.value += `${newFileName}\n`;
               pdfFilesText.push(pdfInfos);
               console.log(pdfFilesText);
            }
         })
      });
   }

   function getFolderContent() {
      // passing directoryPath and callback function
      fs.readdir(filePath, (err, files) => { //files: files in the folder
         //handling error
         if (err) {
            return alert('Unable to scan directory: ' + err);
         }
         //listing all files
         console.log(files);

         pdfFiles = files;
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
            return console.log('The path has not been chosen.');
         };
         filePath = folderPath[0];
         getFolderContent();
      });
   }

   btnOpen.addEventListener('click', selectDirectory);
   btnRenamePdfs.addEventListener('click', renamePdf);
   btnGenerateCsv.addEventListener('click', generateCsvFile);

}())
