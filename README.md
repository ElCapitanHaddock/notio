# Notio
#### by Jeremy Yang
###### Notio is a note-taking app that I designed in freshman year of high school (2015) out of frustration of not having the money to pay for Evernote. This was my first attempt ever at creating a web app/server and the flaws are very apparent in the code. It was a miracle it worked at all, considering I did file I/O using websockets of all things. Keep in mind that running it now may not work because of new web standards. Back in 2015, I did every single math assignment on this. As I did not know how to use databases, everything was stored and parsed in encrypted cleartext files.

### Current features:
- User authentication - stored in encrypted text files, read line by line. It was only later I learned how to use SQL and MongoDB.
- Saving, creating, deleting, and sharing rich-text HTML files
- A rich-text visual editor with text stylizing/images/hyperlinks as well as a toggleable HTML editing view
- Tags that can be added onto files and used to categorize them
- A search bar that can search by tag and by name

### Dependencies:
- socket.io
- expressJS
- redis