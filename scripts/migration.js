import fs from 'fs';
import path from 'path';
import matter from 'gray-matter'

const BASE_DIR = process.argv[2] || '../content/test/';
const DRY_RUN = false;

function getFilesFromDir(baseDir) {
    const files = fs.readdirSync(baseDir);
    let filesFound = [];

    files.forEach(file => {
        const filePath = path.join(baseDir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            filesFound = filesFound.concat(getFilesFromDir(filePath));
        } else if (path.extname(file) === '.md') {
            filesFound.push(filePath);
        }
    });

    return filesFound;
}

function extractDateFromFrontMatter(content) {
    const result = matter(content);
    return result.data.date
}


function extractDateParts(file,isoDate) {
    try {
        const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})T/);
        if (match) {
            return {
                year: parseInt(match[1], 10),
                month: parseInt(match[2], 10),
                day: parseInt(match[3], 10)
            };
        }
    } catch (error) {
        console.log(error);
    }


    return null;
}

function processMdFiles() {
    const mdFiles = getFilesFromDir(BASE_DIR);
    let imgPathUpdates = 0;

    mdFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        const date = extractDateFromFrontMatter(content);
        const dateParts = extractDateParts(file,date);

        if(dateParts) {
            // update relative image paths
            updateImagePath(file,content,dateParts);
            imgPathUpdates += 1;
        }

        // update youtube links

    });

    console.log("Image Path Update Count: " + imgPathUpdates);
}

function updateImagePath(file,content,dateParts) {
    const newImagePath = `/images/blog/${dateParts.year}/${dateParts.month}/${dateParts.day}/`;
    const updatedContent = content.replace(/!\[([^\]]*)\]\(\.\//g, `![\$1](${newImagePath}`);
    if(!DRY_RUN) {
        fs.writeFileSync(file, updatedContent, 'utf-8');
    }
    console.log(`${file} new image path: ${newImagePath}`)
}

if(DRY_RUN) {
    console.log("DRY RUN -----------------------------------------")
}

processMdFiles();
