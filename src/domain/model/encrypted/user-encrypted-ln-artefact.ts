import { EncryptedLnArtefactType } from './encrypted-ln-artefact-type';

export class UserEncryptedLnArtefact {
    id: string;
    userEmail: string;
    lndId: string;
    encryptedLnArtefactType: EncryptedLnArtefactType;
    encryptedArtefact: string;
    creationDate: string;

    constructor(id: string, userEmail: string, lndId: string, encryptedLnArtefactType: EncryptedLnArtefactType,
                encryptedArtefact: string, creationDate: string) {
        this.id = id;
        this.userEmail = userEmail;
        this.lndId = lndId;
        this.encryptedLnArtefactType = encryptedLnArtefactType;
        this.encryptedArtefact = encryptedArtefact;
        this.creationDate = creationDate;
    }
}
