/* eslint-disable @typescript-eslint/naming-convention */
export interface ForestGeoDendroData {
    type:     string;
    features: Feature[];
}

export interface Feature {
    type:       FeatureType;
    geometry:   Geometry;
    properties: Properties;
}

export interface Geometry {
    type:        GeometryType;
    coordinates: number[];
}

export enum GeometryType {
    Point = "Point",
}

export interface Properties {
    tag:                    number;
    stemtag:                number | null;
    treeID:                 number | null;
    stemID:                 number | null;
    "survey.ID":            number;
    year:                   number;
    month:                  number | null;
    day:                    number | null;
    date:                   Date | null;
    biannual:               number | null;
    intraannual:            number | null;
    sp:                     SP;
    Latin:                  Latin | null;
    Genus:                  Genus | null;
    Species:                Species | null;
    Family:                 Family | null;
    quadrat:                number;
    lx:                     number;
    ly:                     number;
    gx:                     number;
    gy:                     number;
    NAD83_X:                number;
    NAD83_Y:                number;
    measure:                number | null;
    dbh:                    number | null;
    dendDiam:               number | null;
    "new.band":             number;
    dendroID:               number | null;
    type:                   number | null;
    dir:                    null;
    dendHt:                 number | null;
    codes:                  null | string;
    notes:                  null | string;
    status:                 Status;
    "field.recorders":      null | string;
    "data.enter":           null | string;
    "crown.condition":      number | null;
    "crown.illum":          number | null;
    lianas:                 null;
    cored:                  number | null;
    "dendro.start.year":    number | null;
    "dendro.start.month":   DendroMonth | null;
    "dendro.start.day":     number | null;
    "dendro.end.year":      number | null;
    "dendro.end.month":     DendroMonth | null;
    "dendro.end.day":       number | null;
    "mortality.year":       number | null;
    location:               Location | null;
    prev_date:              Date | null;
    prev_measure:           number | null;
    days_since_prev:        number | null;
    measure_change:         number | null;
    measure_change_per_day: number | null;
    source_file:            SourceFile;
}

export enum Family {
    Betulaceae = "Betulaceae",
    Cornaceae = "Cornaceae",
    Fabaceae = "Fabaceae",
    Fagaceae = "Fagaceae",
    Juglandaceae = "Juglandaceae",
    Lauraceae = "Lauraceae",
    Magnoliaceae = "Magnoliaceae",
    Malvaceae = "Malvaceae",
    Nyssaceae = "Nyssaceae",
    Oleaceae = "Oleaceae",
    Pinaceae = "Pinaceae",
    Platanaceae = "Platanaceae",
    Rosaceae = "Rosaceae",
    Sapindaceae = "Sapindaceae",
    Ulmaceae = "Ulmaceae",
}

export enum Genus {
    Acer = "Acer",
    Carpinus = "Carpinus",
    Carya = "Carya",
    Cercis = "Cercis",
    Cornus = "Cornus",
    Fagus = "Fagus",
    Fraxinus = "Fraxinus",
    Juglans = "Juglans",
    Liriodendron = "Liriodendron",
    Nyssa = "Nyssa",
    Pinus = "Pinus",
    Platanus = "Platanus",
    Prunus = "Prunus",
    Quercus = "Quercus",
    Robinia = "Robinia",
    Sassafras = "Sassafras",
    Tilia = "Tilia",
    Ulmus = "Ulmus",
}

export enum Latin {
    AcerRubrum = "Acer rubrum",
    CarpinusCaroliniana = "Carpinus caroliniana",
    CaryaCordiformis = "Carya cordiformis",
    CaryaGlabra = "Carya glabra",
    CaryaOvalis = "Carya ovalis",
    CaryaTomentosa = "Carya tomentosa",
    CercisCanadensis = "Cercis canadensis",
    CornusFlorida = "Cornus florida",
    FagusGrandifolia = "Fagus grandifolia",
    FraxinusAmericana = "Fraxinus americana",
    FraxinusNigra = "Fraxinus nigra",
    JuglansNigra = "Juglans nigra",
    LiriodendronTulipifera = "Liriodendron tulipifera",
    NyssaSylvatica = "Nyssa sylvatica",
    PinusStrobus = "Pinus strobus",
    PlatanusOccidentalis = "Platanus occidentalis",
    PrunusSerotina = "Prunus serotina",
    QuercusAlba = "Quercus alba",
    QuercusPrinus = "Quercus prinus",
    QuercusRubra = "Quercus rubra",
    QuercusVelutina = "Quercus velutina",
    RobiniaPseudoacacia = "Robinia pseudoacacia",
    SassafrasAlbidum = "Sassafras albidum",
    TiliaAmericana = "Tilia americana",
    UlmusRubra = "Ulmus rubra",
}

export enum Species {
    Alba = "alba",
    Albidum = "albidum",
    Americana = "americana",
    Canadensis = "canadensis",
    Caroliniana = "caroliniana",
    Cordiformis = "cordiformis",
    Florida = "florida",
    Glabra = "glabra",
    Grandifolia = "grandifolia",
    Nigra = "nigra",
    Occidentalis = "occidentalis",
    Ovalis = "ovalis",
    Prinus = "prinus",
    Pseudoacacia = "pseudoacacia",
    Rubra = "rubra",
    Rubrum = "rubrum",
    Serotina = "serotina",
    Strobus = "strobus",
    Sylvatica = "sylvatica",
    Tomentosa = "tomentosa",
    Tulipifera = "tulipifera",
    Velutina = "velutina",
}

export enum DendroMonth {
    April = "April",
    December = "December",
    February = "February",
    January = "January",
    July = "July",
    June = "June",
    March = "March",
    May = "May",
    November = "November",
    October = "October",
}

export enum Location {
    North = "North",
    South = "South",
}

export enum SourceFile {
    ScbiDendroAll2010CSV = "scbi.dendroAll_2010.csv",
    ScbiDendroAll2011CSV = "scbi.dendroAll_2011.csv",
    ScbiDendroAll2012CSV = "scbi.dendroAll_2012.csv",
    ScbiDendroAll2013CSV = "scbi.dendroAll_2013.csv",
    ScbiDendroAll2014CSV = "scbi.dendroAll_2014.csv",
    ScbiDendroAll2015CSV = "scbi.dendroAll_2015.csv",
    ScbiDendroAll2016CSV = "scbi.dendroAll_2016.csv",
    ScbiDendroAll2017CSV = "scbi.dendroAll_2017.csv",
    ScbiDendroAll2018CSV = "scbi.dendroAll_2018.csv",
    ScbiDendroAll2019CSV = "scbi.dendroAll_2019.csv",
    ScbiDendroAll2020CSV = "scbi.dendroAll_2020.csv",
    ScbiDendroAll2021CSV = "scbi.dendroAll_2021.csv",
    ScbiDendroAll2022CSV = "scbi.dendroAll_2022.csv",
    ScbiDendroAll2023CSV = "scbi.dendroAll_2023.csv",
    ScbiDendroAll2024CSV = "scbi.dendroAll_2024.csv",
    ScbiDendroAll2025CSV = "scbi.dendroAll_2025.csv",
    ScbiDendroAll2026CSV = "scbi.dendroAll_2026.csv",
}

export enum SP {
    Acru = "acru",
    Caca = "caca",
    Caco = "caco",
    Cagl = "cagl",
    Caovl = "caovl",
    Cato = "cato",
    Ceca = "ceca",
    Cofl = "cofl",
    Fagr = "fagr",
    Fram = "fram",
    Frni = "frni",
    Juni = "juni",
    Litu = "litu",
    Nysy = "nysy",
    Pist = "pist",
    Ploc = "ploc",
    Prse = "prse",
    Qual = "qual",
    Qupr = "qupr",
    Quru = "quru",
    Quve = "quve",
    Rops = "rops",
    SPQual = "qual ",
    SPQuve = "quve ",
    Saal = "saal",
    Tiam = "tiam",
    Ulru = "ulru",
}

export enum Status {
    Alive = "alive",
    Dead = "dead",
}

export enum FeatureType {
    Feature = "Feature",
}
