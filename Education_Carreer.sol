// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Ownable.sol";

contract Main is Ownable {
    // Document structure
    struct Document {
        uint64 adhaarId; // student identification
        string ipfsHash; // document ipfs hash
        address uploader; // Institute or company that uploaded the document
        string uploaderName; // uploader
        string dateUploaded; // date
        bool verified; // verified or not
        CredentialType credentialType; // type of document
        string institutionName; // college or company name
    }

    // Define credential types
    enum CredentialType {
        EDUCATIONAL,
        PROFESSIONAL,
        CERTIFICATION,
        OTHER
    }

    // User structure for User (student or employee) accounts
    struct StudentProfile {
        bool isRegistered;
        address studentAddress;
        uint64 adhaarId;
        mapping(address => bool) authorizedViewers;
    }

    // Mappings
    mapping(uint64 => Document[]) internal userToDoc;
    mapping(address => uint8) public institute;
    mapping(uint64 => StudentProfile) private students;

    // Map student addresses to their Adhaar IDs for reverse lookup
    mapping(address => uint64) private addressToAdhaar;

    // Events
    event StudentRegistered(
        uint64 indexed adhaarId,
        address indexed studentAddress
    );
    event DocumentStored(
        uint64 indexed adhaarId,
        string ipfsHash,
        address indexed uploader,
        CredentialType indexed credentialType
    );
    event DocumentVerified(
        uint64 indexed adhaarId,
        address verifier,
        CredentialType credentialType
    );
    event AccessGranted(uint64 indexed adhaarId, address viewer);
    event AccessRevoked(uint64 indexed adhaarId, address viewer);

    // Modifiers
    modifier validInstitute() {
        require(institute[msg.sender] == 1, "Please Verify Your institute!");
        _;
    }

    modifier documentExists(uint64 _adhaar, CredentialType _type) {
        bool exists = false;
        for (uint i = 0; i < userToDoc[_adhaar].length; i++) {
            if (userToDoc[_adhaar][i].credentialType == _type) {
                exists = true;
                break;
            }
        }
        require(exists, "Document does not exist");
        _;
    }

    modifier onlyDocumentOwner(uint64 _adhaarId) {
        require(
            students[_adhaarId].studentAddress == msg.sender,
            "Only document owner can perform this action"
        );
        _;
    }

    modifier canViewDocument(uint64 _adhaarId) {
        bool hasAccess = false;

        // Student viewing their own document
        if (students[_adhaarId].studentAddress == msg.sender) {
            hasAccess = true;
        }
        // Authorized viewer
        else if (students[_adhaarId].authorizedViewers[msg.sender]) {
            hasAccess = true;
        }
        // Contract owner or verified institute
        else if (msg.sender == owner() || institute[msg.sender] == 1) {
            hasAccess = true;
        }
        // Check if any document was uploaded by the sender
        else {
            for (uint i = 0; i < userToDoc[_adhaarId].length; i++) {
                if (userToDoc[_adhaarId][i].uploader == msg.sender) {
                    hasAccess = true;
                    break;
                }
            }
        }

        require(hasAccess, "Not authorized to view this document");
        _;
    }

    // Student registration - link Adhaar ID with student address
    function registerStudent(uint64 _adhaarId) public {
        require(
            !students[_adhaarId].isRegistered,
            "Adhaar ID already registered"
        );
        require(addressToAdhaar[msg.sender] == 0, "Address already registered");

        students[_adhaarId].isRegistered = true;
        students[_adhaarId].studentAddress = msg.sender;
        addressToAdhaar[msg.sender] = _adhaarId;

        emit StudentRegistered(_adhaarId, msg.sender);
    }

    // Institute verification by contract owner
    function instiVerification(address _instituteAddress) public onlyOwner {
        institute[_instituteAddress] = 1;
    }

    // Store document - called by verified institutes
    function StoreDocument(
        string memory _ipfsHash,
        string memory _uploadDate,
        uint64 _adhaarId,
        string memory _uploader,
        CredentialType _type,
        string memory _institutionName
    ) external validInstitute {
        Document memory newDoc = Document(
            _adhaarId,
            _ipfsHash,
            msg.sender,
            _uploader,
            _uploadDate,
            false,
            _type,
            _institutionName
        );

        // Check if a document of this type already exists
        for (uint i = 0; i < userToDoc[_adhaarId].length; i++) {
            if (userToDoc[_adhaarId][i].credentialType == _type) {
                // Replace the existing document
                userToDoc[_adhaarId][i] = newDoc;
                emit DocumentStored(_adhaarId, _ipfsHash, msg.sender, _type);
                return;
            }
        }

        // If no document of this type exists, add a new one
        userToDoc[_adhaarId].push(newDoc);
        emit DocumentStored(_adhaarId, _ipfsHash, msg.sender, _type);
    }

    // Verify document by matching hash
    function verify(
        string memory _newHash,
        uint64 _adhaar,
        CredentialType _type
    ) public documentExists(_adhaar, _type) {
        for (uint i = 0; i < userToDoc[_adhaar].length; i++) {
            if (userToDoc[_adhaar][i].credentialType == _type) {
                require(
                    keccak256(abi.encodePacked(_newHash)) ==
                        keccak256(
                            abi.encodePacked(userToDoc[_adhaar][i].ipfsHash)
                        ),
                    "Hash mismatch"
                );

                userToDoc[_adhaar][i].verified = true;
                emit DocumentVerified(_adhaar, msg.sender, _type);
                break;
            }
        }
    }

    // Grant access to view document - only student can grant access
    function grantAccess(
        uint64 _adhaarId,
        address _viewer
    ) public onlyDocumentOwner(_adhaarId) {
        students[_adhaarId].authorizedViewers[_viewer] = true;
        emit AccessGranted(_adhaarId, _viewer);
    }

    // Revoke access to view document - only student can revoke access
    function revokeAccess(
        uint64 _adhaarId,
        address _viewer
    ) public onlyDocumentOwner(_adhaarId) {
        students[_adhaarId].authorizedViewers[_viewer] = false;
        emit AccessRevoked(_adhaarId, _viewer);
    }

    // Get documents for a specific Aadhaar ID
    function GetAllDocs(
        uint64 _adhaarId
    ) public view canViewDocument(_adhaarId) returns (Document[] memory) {
        return userToDoc[_adhaarId];
    }

    // Get a specific document by type
    function GetDocByType(
        uint64 _adhaarId,
        CredentialType _type
    )
        public
        view
        canViewDocument(_adhaarId)
        documentExists(_adhaarId, _type)
        returns (Document memory)
    {
        for (uint i = 0; i < userToDoc[_adhaarId].length; i++) {
            if (userToDoc[_adhaarId][i].credentialType == _type) {
                return userToDoc[_adhaarId][i];
            }
        }

        // This line should never be reached due to the documentExists modifier
        revert("Document not found");
    }

    // Check if an address has permission to view documents for a specific Aadhaar ID
    function hasViewAccess(
        uint64 _adhaarId,
        address _viewer
    ) public view returns (bool) {
        bool isUploader = false;
        for (uint i = 0; i < userToDoc[_adhaarId].length; i++) {
            if (userToDoc[_adhaarId][i].uploader == _viewer) {
                isUploader = true;
                break;
            }
        }

        return (students[_adhaarId].studentAddress == _viewer ||
            students[_adhaarId].authorizedViewers[_viewer] ||
            isUploader ||
            _viewer == owner() ||
            institute[_viewer] == 1);
    }

    // Get student's own Aadhaar ID from their address
    function getMyAdhaarId() public view returns (uint64) {
        uint64 adhaarId = addressToAdhaar[msg.sender];
        require(adhaarId != 0, "Not registered as a student");
        return adhaarId;
    }

    // Check if documents exist for a given Aadhaar ID
    function hasDocuments(uint64 _adhaarId) public view returns (bool) {
        return userToDoc[_adhaarId].length > 0;
    }

    // Check if a specific document type exists for a given Aadhaar ID
    function hasDocumentOfType(
        uint64 _adhaarId,
        CredentialType _type
    ) public view returns (bool) {
        for (uint i = 0; i < userToDoc[_adhaarId].length; i++) {
            if (userToDoc[_adhaarId][i].credentialType == _type) {
                return true;
            }
        }
        return false;
    }

    // Count the number of documents for a given Aadhaar ID
    function getDocumentCount(uint64 _adhaarId) public view returns (uint) {
        return userToDoc[_adhaarId].length;
    }
}
