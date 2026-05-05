const fs = require('fs');

const rulesContent = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
    
    // Core Helpers
    function isSignedIn() { 
      return request.auth != null; 
    }
    function isVerified() {
      // In development environments with popup, sometimes email_verified might not be strict or true immediately, but let's encourage it or just make sure email exists.
      // return request.auth.token.email_verified == true;
      return true; // Skipping email_verified for now for broader compatibility, but we require auth.
    }
    function incoming() { return request.resource.data; }
    function existing() { return resource.data; }
    
    function isValidId(id) { 
        return id is string && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\\\-]+$'); 
    }
    
    function isValidEdital(data) {
        return data.keys().hasAll(['userId', 'titulo', 'areas'])
            && data.keys().size() <= 4 // allow an optional updatedAt or createdAt if needed later, but strict is 3
            && data.userId is string
            && data.userId == request.auth.uid
            && data.titulo is string
            && data.titulo.size() <= 200
            && data.areas is list;
    }
    
    match /editais/{editalId} {
        allow read: if isSignedIn() && existing().userId == request.auth.uid;
        
        allow list: if isSignedIn() && resource.data.userId == request.auth.uid;
        
        allow create: if isSignedIn() 
                      && isValidId(editalId) 
                      && isValidEdital(incoming());
                      
        allow update: if isSignedIn() 
                      && existing().userId == request.auth.uid 
                      && isValidEdital(incoming())
                      && incoming().userId == existing().userId
                      && incoming().diff(existing()).affectedKeys().hasOnly(['titulo', 'areas']);
                      
        allow delete: if isSignedIn() && existing().userId == request.auth.uid;
    }
  }
}
`;

fs.writeFileSync('firestore.rules', rulesContent);
console.log('Firebase rules generated.');
