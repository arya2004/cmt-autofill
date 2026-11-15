# Privacy

Author email, first/last name, organization and country are stored in Chrome sync
storage. Chrome may synchronize this data through your account according to
browser settings. The project operates no profile server or analytics endpoint.
Autofill enters saved details into Microsoft CMT, which processes them under its
own policies.

V2 uses `cmtAutofill.v2.settings` and `cmtAutofill.v2.profile.<id>` records. Older
namespaces are ignored without deletion. The trash control deletes a profile;
one must remain. Remove the extension and review Chrome sync settings to remove
all extension data. Draft edits live only in popup memory.

Current manifest permissions:

- `storage`: save profiles with Chrome sync.
- `activeTab` and `scripting`: inspect the active tab and recover a missing receiver.
- CMT host permission: access submission creation URLs.
- Content-script matches are currently `<all_urls>`, so its listener can run on
  all supported websites. Popup autofill targets CMT.
- `declarativeContent`: retained from the original manifest; currently unused.

The legacy automation logs author objects to the target page developer console.
Do not share unredacted console output. Broad script access and logging remain
known limitations; this work does not change the canceled automation scope.

No hosted website or GitHub Pages deployment is included.
