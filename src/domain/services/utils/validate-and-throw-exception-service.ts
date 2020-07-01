export const validateAndThrowExceptionInCaseOfErrorWithCode =
    async <E extends Error, T>
        (
            validationFunction: () => Promise<void>,
            errorToThrowOnValidationFailure: new (message: string, errorTypeEnum: T) => E,
            errorDetails: T,
    ): Promise<void> => {

        try {
            await validationFunction();
        } catch (err) {
            throw new errorToThrowOnValidationFailure(err.message, errorDetails);
        }

    };
