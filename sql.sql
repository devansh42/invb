create table users(uid int not null auto_increment primary key,username varchar(20) not null, password char(64) not null,role tinyint);

create table workplace(
    id int not null auto_increment primary key,
     name varchar(100) not null,
    addr varchar(500) not null,
    op_time int not null,
    cl_time int not null,
    gid int default 0
    );
create table groups(
    id int not null auto_increment primary key,
    name varchar(100) not null,
    type int not null
);
create table account(
    id int not null auto_increment primary key,
    name varchar(100) not null,
    gender char not null default 'm',
    dob bigint,
    mobile_no varchar(15) not null,
    email varchar(100),
    addr varchar(200) not null,
    town varchar(20) not null,
    pincode char(6),
    id_proof tinyint,
    id_proof_no varchar(100),
    join_date bigint,
    gid id default 0
);
create table id_proofs(
    id tinyint not null auto_increment primary key,
    name varchar(20)
);    
create table units(
    id tinyint auto_increment primary key,
    name varchar(30) not null,
    symbol varchar(5) not null
);
create table item(
    id int auto_increment primary key,
    name varchar(100) not null,
    unit tinyint not null,
    gid int not null,
    constraint fk_i_u foreign key(unit) REFERENCES units(id),
    constraint fk_i_g foreign key(gid) REFERENCES groups(id)

);

create table group_type(
    id int auto_increment primary key,
    text varchar(20) not null
);

create table id_proof_type(
    id tinyint auto_increment primary key,
    name varchar(20) not null
);
create table menu(
    id varchar(50) not null primary key,
    name varchar(50)
);
create table privilege(
    uid int,
    menu varchar(50),
    constraint fk_p_u foreign key(uid) REFERENCES users(uid),
    constraint fk_p_m foreign key(menu) REFERENCES menu(id) 
);

create table routing(
    id int not null auto_increment primary key,
    name varchar(100) not null,
    gid int not null,
    description varchar(500),
    operations varchar(1000),
    constraint fk_r_g foreign key(gid) REFERENCES groups(id)  
);


create table operations(id int not null auto_increment primary key,name varchar(100) not null,
    gid int not null,
    description varchar(500),
    workplace int not null,
    constraint fk_op_w foreign key(workplace) REFERENCES workplace(id),
    constraint fk_op_g foreign key(gid) REFERENCES groups(id)
);

create table bom_material(
   bom int not null,
   item int not null,
   qty float,
   rate float,
   amt float,
   constraint fk_bm_b foreign key(bom) REFERENCES bom(id),
   constraint fk_bm_i foreign key(item) REFERENCES item(id) 
);

create table bom(
    id int not null auto_increment primary key,
    item int not null,
    qty float not null,
    routing int not null,
    description varchar(500),
    material int not null,
    constraint fk_b_i foreign key(item) REFERENCES item(id),
    constraint fk_b_r foreign key(routing) REFERENCES routing(id)
);

create table workorder(
    id int not null auto_increment  primary key,
    qty float not null,
    bom int not null,
    st_date datetime,
    de_date datetime,
    nbom char default 0,
    constraint fk_wo_b foreign key(bom) REFERENCES bom(id)
);

create table job_card(
  id int not null auto_increment primary key,
  workorder int not null,
  operation int not null,
  worker int ,
  constraint fk_j_wo foreign key(workorder) REFERENCES workorder(id),
  constraint fk_j_op foreign key(operation) REFERENCES operations(id),
  constraint fk_j_a foreign key(worker) REFERENCES account(id)  
);

create table route_operations(
    route int not null,
    operation int not null,
    constraint fk_ro_r foreign key(route) REFERENCES route(id),
    constraint fk_ro_op foreign key(operation) REFERENCES operation(id)
);


create table job_logs(
    job_card int not null ,
    st_time datetime default now(),
    en_time datetime,
    qty float not null,
    constraint fk_jl_jc foreign key(job_card) REFERENCES job_card(id)    
);