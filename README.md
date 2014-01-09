peasy.js
========

Easy peasy lemon squeezy dot jay ess

install all the necessary modules (either look at the requires in the code or do it error by error)

run main.js to serve all the content.

default port is 1337, but that should change.

destroy_password should be a long complicated string, it is what allows objects to be deleted.  I left it as a password so an admin can set certain objects to last longer from the client end.

honestly, security is not a concern here.  very little is done to prevent anyone from truly exploiting this server.  it is meant for easy as cake prototyping.

How to use
========

save(name, variable, options);

- name: A unique name that is paired with the key and then hashed to create an id for later retrieval.
- variable: The variable to be stored.  Can be anything javascript.
- options: {password:"somepassword"} Basically all there is right now.  Password protect the object.

load(name, callback, options);

- name: Name of the object to be loaded.  Needs to have the same key for the same object.
- callback(variable):  callback is passed in the loaded variable when it comes.  By default the callback is called every time the variable is updated on the server.
- options: {persistent:false, password:"somepassword"} persistent:false means only call once.
