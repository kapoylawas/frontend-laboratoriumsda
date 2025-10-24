import Hashids from 'hashids';

const hashids = new Hashids('invoice-sidoarjo-lab-secret-key', 10);

export const encodeId = (id) => {
    return hashids.encode(id);
};

export const decodeId = (hash) => {
    const decoded = hashids.decode(hash);
    return decoded.length > 0 ? decoded[0] : null;
};