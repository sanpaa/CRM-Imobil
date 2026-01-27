import propertyGrid from './property-grid/manifest';
import { register, getRegistry } from './registry';

[propertyGrid].forEach(register);

export { getRegistry } from './registry';
