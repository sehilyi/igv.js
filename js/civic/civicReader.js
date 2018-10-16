var igv = (function (igv) {


        igv.CivicReader = function (config) {
            this.config = config;
        }

        igv.CivicReader.prototype.readFeatures = function (chr, start, end) {


            const self = this;

            return igv.xhr.loadJson(this.config.url + "/variants/?count=5000")

                .then(function (json) {

                    const records = json.records;
                    const features = [];

                    for (let record of records) {

                        if (record.coordinates) {

                            const id = record.id;
                            const coordinates = record.coordinates;

                            if (coordinates.chromosome) {
                                features.push(
                                    new CivicVariant(
                                        coordinates.chromosome,
                                        coordinates.start - 1,     // UCSC 0 convention
                                        coordinates.stop,
                                        record
                                    ));
                            }

                            if (coordinates.chromosome2) {
                                features.push(
                                    new CivicVariant(
                                        coordinates.chromosome2,
                                        coordinates.start2 - 1,     // UCSC 0 convention
                                        coordinates.stop2,
                                        record
                                    ));
                            }
                        }

                    }
                    return features;
                });
        }


        function CivicVariant(chr, start, end, record) {
            this.chr = chr;
            this.start = start;
            this.end = end;
            this.id = record.id;
            this.entrezName = record.entrez_name;
            this.name = record.name;
            this.actionabilityScore = record.civic_actionability_score;

            if (record.coordinates.reference_bases) {
                this.refBases = record.coordinates.reference_bases;
            }
            if (record.coordinates.variant_bases) {
                this.altBases = record.coordinates.variant_bases
            }
            if (record.variant_types) {
                this.variant_types = record.variant_types;
            }

            this.locationString = (this.chr + ":" +
                igv.numberFormatter(this.start + 1) + "-" +
                igv.numberFormatter(this.end));

            // Color based on actionability score
            if (this.actionabilityScore !== undefined) {
                let alpha;
                if (this.actionabilityScore <= 10) {
                    alpha = 0.2;
                }
                else {
                    const v = Math.min(30, this.actionabilityScore);
                    alpha = 0.2 + 0.8 * Math.log10((v - 10) / 2);
                }
                this.alpha = alpha;
            }


        }

        CivicVariant.prototype.popupData = function () {


            const link = createLink("CIViC", "https://civicdb.org/links/variants/" + this.id);

            let cravatLink;
            const isSnp =
                this.refBases !== this.altBases &&
                this.refBases && this.refBases.length === 1 &&
                this.altBases && this.altBases.length === 1;

            if (isSnp) {
                const ref = this.refBases;
                const alt = this.altBases;
                cravatLink = createLink("CRAVAT", "http://www.cravat.us/CRAVAT/variant.html?variant=chr7_140808049_+_" + ref + "_" + alt);

            }

            const pd = [link];

            if (cravatLink) {
                pd.push(cravatLink);

            }

            pd.push({name: "Entrez", value: createLink(this.entrezName, "https://ghr.nlm.nih.gov/gene/" + this.entrezName)});
            pd.push({name: "Name", value: this.name});

            if (this.variant_types && this.variant_types.length > 0) {

                const name = this.variant_types.length === 1 ? "Type" : "Types";
                let typeString;
                for (let vt of this.variant_types) {
                    if (!typeString) typeString = vt.display_name;
                    else typeString += ", " + vt.display_name;
                }
                ;
                pd.push({name: name, value: typeString});
            }

            pd.push({name: "Actionability", value: this.actionabilityScore});


            pd.push({name: "Location", value: this.locationString});

            return pd;


            function createLink(text, href) {
                return "<a target='_blank' " + "href='" + href + "'>" + text + "</a>"
            }

        }

        return igv;


    }
)(igv || {});