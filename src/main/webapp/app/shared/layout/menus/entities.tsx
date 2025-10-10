import React from 'react';

import EntitiesMenuItems from 'app/entities/menu';
import { NavDropdown } from './menu-components';

export const EntitiesMenu = () => (
  <NavDropdown icon="th-list" name="Entities" id="entity-menu" data-cy="entity" style={{ maxHeight: '80vh', overflow: 'auto' }}>
    <EntitiesMenuItems />
  </NavDropdown>
);
