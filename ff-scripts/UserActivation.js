var ff = require('ffef/FatFractal');

var debug_mode = true;

exports.validateUser = function() {
    var user = ff.getEventHandlerData();

    function ActivationRequest(usr) {
       this.clazz = "ActivationRequest";
       this.userGuid = usr.guid;
       this.createdBy = "system";
    }

    var ar = new ActivationRequest(user);

    if(!user.active) {
        if(debug_mode) print("\n\t*** validateUser: creating activation request for " + user + "\n");
        var activateRequest = ff.createObjAtUri(ar, "/ActivationRequest");
        if(debug_mode) print("\t*** validateUser: Sending email\n");

        var link = ff.getHttpAppAddress() + "/ff/ext/verifyRegistration?guid=" + activateRequest.guid;

        var textMessage = "Thanks for signing up! Click here " + link + " to activate your account";

        ff.sendEmail(
            {
                host:"<YourSMTPHost>", port:"465",
                auth:"true", authPort:"465",
                username:"<InsertYourUserNameHere>", password:"<InsertYourPasswordHere",
                from:"system@fatfractal.com",
                fromName:"[My Shiny App]",
                to:user.email,
                subject:"Activate your account",
                text:textMessage,
                html:null
            }
        );

        if(debug_mode) print("\t*** validateUser: Created activation request\n\n");
    } else {
        if(debug_mode) print("\n\t*** validateUser: user is already active, skipping sendValidationEmail for: " + user + "\n");
    }
}

exports.verifyRegistration = function() {
    var data = ff.getExtensionRequestData();

    var r = ff.response();

    var guid = data.httpParameters['guid'];
    if (! guid) {
        r.responseCode = "400";
        r.mimeType = "text/html";
        r.result = "<html><head></head><body><h2>Invalid ActivationRequest</h2></body></html>";
        return;
    }

    var htmlContent;
    var activationRequest = ff.getObjFromUri("/ff/resources/ActivationRequest/" + guid);
    if (! activationRequest) {
        r.responseCode = "404";
        r.mimeType = "text/html";
        r.result = "<html><head></head><body><h2>ActivationRequest not found</h2></body></html>";
        return;
    }

    var user = ff.getUser(activationRequest.userGuid);
    if (! user) {
        r.responseCode = "404";
        r.mimeType = "text/html";
        r.result = "<html><head></head><body><h2>We delete users who have not activated after 1 year - please register again!</h2></body></html>";
        return;
    }

    // Activate the user
    user.active = true;
    ff.updateObj(user);

    // Clean up
    ff.deleteObj(activationRequest);
    r.responseCode = "200";
    r.mimeType = "text/html";
    r.result = "<html><head></head><body><h2>Your account has been successfully activated</h2></body></html>";
}
