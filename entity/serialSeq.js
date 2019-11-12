//This file contains code for serial no sequence class definition

class SerialSequence {

    id = 1; //the default one
    prefix = null;
    suffix = null;
    initialValue = 1;
    lastValue = 0;
    step = 0;
    digits = 0;

    /**
     * Populates this object with given property objects 
     * @param {object} o contains serial sequence properties which may be retrived from database or any other kind of datasource
     */
    populateFromObject(o) {
        this.id = o.id;
        this.prefix = o.prefix;
        this.suffix = o.suffix;
        this.initialValue = o.initialValue;
        this.lastValue = os.lastValue;
        this.step = o.step;
        this.digits = o.digits;
    }

    /**
     * 
     * @param {Number} no is variable part of serial no sequence
     *@returns {string} a formatted serial no
     */
    getSerialNo(no) {
        let dc = 0;
        let m = no;
        while (m > 0) { dc++; m /= 10 }
        let mi = "0".repeat(this.digits - dc);
        mi += no;

        let sn = "";
        const isNull = v => (v == null) ? "" : v;

        sn += isNull(this.prefix);
        sn += mi;
        sn += isNull(this.suffix);
        return sn;
    }

    /**
     * Returns next formatted and real serial no of serial no sequence
     *@returns Array contain formated serial no and variable part of serial no
     *@throws Error, when step is not defined 
    */
    getNextSerialNo() {
        if (this.step == 0) throw Error("Serial step is not defined");
        this.lastValue += this.step;
        const no = this.lastValue;

        return [this.getSerialNo(no), no];
    }

}

module.exports = SerialSequence;